import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // Konfigurasi Aplikasi & Environment
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'order-manager-b2b';
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;

        let app, auth, db;
        let currentUser = null;
        let ordersCollectionRef = null;

        // Data bawaan awal (Fallback Demo Data)
        let orders = [
            {
                id: 'ORD-1001',
                idLop: 'LOP-2026-0811',
                customer: 'PT Bank Mandiri (Persero) Tbk',
                ccNipnas: 'CC-BM-01 / NIP-8820',
                segmen: 'DPS',
                kategori: 'Renewal',
                produk: 'Cloud Tier-3',
                bw: '1 Gbps',
                durasi: 12,
                quote: 'Q-2026-BM-01',
                orderNo: 'WO-88201',
                sid: 'SID-992018',
                ba: '1002938481',
                otc: 15000000,
                bulanan: 35000000,
                totalProyek: 435000000,
                provcom: '2026-08-05',
                billcom: '2026-08-10',
                status: 'Completed',
                noKontrak: 'KTR/BM/2026/089',
                reviewKontrak: '',
                startDate: '2026-08-01',
                endDate: '2027-07-31',
                keterangan: 'Perpanjangan kontrak layanan DPS tahun ke-3.'
            },
            {
                id: 'ORD-1002',
                idLop: 'LOP-2026-0842',
                customer: 'PT Freeport Indonesia',
                ccNipnas: 'CC-FI-09 / NIP-4412',
                segmen: 'DSS',
                kategori: 'PSB',
                produk: 'Smart Mining IoT Solution',
                bw: '500 Mbps',
                durasi: 24,
                quote: 'Q-2026-FI-09',
                orderNo: 'WO-88205',
                sid: 'SID-992044',
                ba: '1003928112',
                otc: 25000000,
                bulanan: 45000000,
                totalProyek: 1105000000,
                provcom: '2026-08-15',
                billcom: '',
                status: 'Inprogress',
                noKontrak: 'KTR/FI-P/2026/004',
                reviewKontrak: '',
                startDate: '2026-08-15',
                endDate: '2028-08-14',
                keterangan: 'Solusi DSS smart mining, menunggu verifikasi Billcom Finance.'
            },
            {
                id: 'ORD-1003',
                idLop: 'LOP-2026-0899',
                customer: 'Dinas Kominfo Provinsi Maluku Utara',
                ccNipnas: 'CC-KM-02 / NIP-3391',
                segmen: 'DPS',
                kategori: 'Modify BW',
                produk: 'E-Gov Cloud Portal',
                bw: '100 Mbps',
                durasi: 12,
                quote: 'Q-2026-KOM-02',
                orderNo: 'WO-88210',
                sid: 'SID-992090',
                ba: '1004829102',
                otc: 5000000,
                bulanan: 18000000,
                totalProyek: 221000000,
                provcom: '2026-07-20',
                billcom: '2026-07-25',
                status: 'Pending Baso',
                noKontrak: 'KTR/DISHUB/2026/11',
                reviewKontrak: '',
                startDate: '2026-07-01',
                endDate: '2027-06-30',
                keterangan: 'Layanan DPS platform publik, dokumen BASO sedang diproses.'
            }
        ];

        let currentEditingId = null;
        let itemToDelete = null;

        async function initCloudSync() {
            const cloudStatusEl = document.getElementById('cloudStatusText');
            const cloudStatusBadge = document.getElementById('cloudStatus');

            if (!firebaseConfig) {
                if (cloudStatusBadge) cloudStatusBadge.className = "hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold";
                if (cloudStatusEl) cloudStatusEl.innerText = "Lokal Mode";
                renderTable();
                return;
            }

            try {
                app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                db = getFirestore(app);

                // Authenticate Auth dulu sebelum query Firestore
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }

                onAuthStateChanged(auth, async (user) => {
                    currentUser = user;
                    if (user) {
                        if (cloudStatusBadge) cloudStatusBadge.className = "hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold";
                        if (cloudStatusEl) cloudStatusEl.innerText = "Cloud Synced";

                        // Menggunakan path resmi data publik
                        ordersCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');

                        // Real-time listener dengan penanganan error
                        onSnapshot(ordersCollectionRef, async (snapshot) => {
                            if (snapshot.empty) {
                                // Jika database masih kosong, isi dengan data awal
                                for (const item of orders) {
                                    const itemDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', item.id);
                                    await setDoc(itemDocRef, item);
                                }
                            } else {
                                orders = snapshot.docs.map(doc => doc.data());
                                applyFilters();
                            }
                        }, (error) => {
                            console.error("Firestore sync error:", error);
                            showToast("Gagal memuat sinkronisasi Cloud.", "error");
                        });
                    }
                });
            } catch (err) {
                console.error("Cloud Auth Error:", err);
                if (cloudStatusEl) cloudStatusEl.innerText = "Offline Mode";
                renderTable();
            }
        }

        const formatRupiah = (num) => {
            if (isNaN(num) || num === null) return 'Rp 0';
            return 'Rp ' + Number(num).toLocaleString('id-ID');
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        };

        function renderTable(data = orders) {
            const tableBody = document.getElementById('orderTableBody');
            const emptyState = document.getElementById('emptyState');
            if (!tableBody) return;
            
            tableBody.innerHTML = '';

            if (data.length === 0) {
                emptyState?.classList.remove('hidden');
                emptyState?.classList.add('flex');
            } else {
                emptyState?.classList.add('hidden');
                emptyState?.classList.remove('flex');

                data.forEach(order => {
                    const getBadgeClass = (val) => {
                        if (val === 'Completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                        if (val === 'Inprogress') return 'bg-blue-100 text-blue-800 border-blue-200';
                        if (val === 'Pending Baso') return 'bg-amber-100 text-amber-800 border-amber-200';
                        return 'bg-slate-100 text-slate-700 border-slate-200';
                    };

                    const getSegmenBadge = (seg) => {
                        if (seg === 'DPS') return 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold';
                        if (seg === 'DSS') return 'bg-cyan-100 text-cyan-800 border-cyan-300 font-bold';
                        return 'bg-slate-100 text-slate-700 border-slate-200';
                    };

                    const reviewKontrakContent = order.reviewKontrak 
                        ? `<a href="${order.reviewKontrak}" target="_blank" class="text-indigo-600 hover:underline font-medium flex items-center gap-1"><i class="fas fa-external-link-alt text-[10px]"></i> Link Kontrak</a>` 
                        : '-';

                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-slate-50 transition-colors border-b border-slate-100';
                    tr.innerHTML = `
                        <td class="px-4 py-3 font-semibold text-indigo-700 whitespace-nowrap">${order.idLop || '-'}</td>
                        <td class="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap max-w-[200px] truncate" title="${order.customer}">${order.customer}</td>
                        <td class="px-4 py-3 text-slate-600 font-mono whitespace-nowrap">${order.ccNipnas || '-'}</td>
                        <td class="px-4 py-3 whitespace-nowrap"><span class="px-2.5 py-1 rounded text-[10px] uppercase border ${getSegmenBadge(order.segmen)}">${order.segmen || 'DPS'}</span></td>
                        <td class="px-4 py-3 text-slate-600 whitespace-nowrap"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">${order.kategori}</span></td>
                        <td class="px-4 py-3 text-slate-700 font-medium whitespace-nowrap max-w-[180px] truncate" title="${order.produk}">${order.produk}</td>
                        <td class="px-4 py-3 text-slate-600 whitespace-nowrap">${order.bw || '-'}</td>
                        <td class="px-4 py-3 text-slate-600 whitespace-nowrap">${order.durasi} Bln</td>
                        <td class="px-4 py-3 text-slate-500 whitespace-nowrap">${order.quote || '-'}</td>
                        <td class="px-4 py-3 text-slate-500 whitespace-nowrap">${order.orderNo || '-'}</td>
                        <td class="px-4 py-3 text-slate-600 font-mono whitespace-nowrap">${order.sid || '-'}</td>
                        <td class="px-4 py-3 text-slate-600 font-mono whitespace-nowrap">${order.ba || '-'}</td>
                        <td class="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">${formatRupiah(order.otc)}</td>
                        <td class="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">${formatRupiah(order.bulanan)}</td>
                        <td class="px-4 py-3 text-right font-bold text-indigo-700 whitespace-nowrap">${formatRupiah(order.totalProyek)}</td>
                        <td class="px-4 py-3 text-slate-600 whitespace-nowrap">${formatDate(order.provcom)}</td>
                        <td class="px-4 py-3 text-slate-600 whitespace-nowrap">${formatDate(order.billcom)}</td>
                        <td class="px-4 py-3 whitespace-nowrap"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeClass(order.status)}">${order.status}</span></td>
                        <td class="px-4 py-3 text-slate-600 whitespace-nowrap">${order.noKontrak || '-'}</td>
                        <td class="px-4 py-3 whitespace-nowrap">${reviewKontrakContent}</td>
                        <td class="px-4 py-3 text-slate-500 whitespace-nowrap">${formatDate(order.startDate)}</td>
                        <td class="px-4 py-3 text-slate-500 whitespace-nowrap">${formatDate(order.endDate)}</td>
                        <td class="px-4 py-3 text-slate-600 whitespace-nowrap max-w-[180px] truncate" title="${order.keterangan || '-'}">${order.keterangan || '-'}</td>
                        <td class="px-4 py-3 text-center whitespace-nowrap sticky-col">
                            <div class="flex items-center justify-center space-x-1">
                                <button onclick="viewDetail('${order.id}')" class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Lihat Detail">
                                    <i class="fas fa-eye text-sm"></i>
                                </button>
                                <button onclick="openModal('edit', '${order.id}')" class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit Order">
                                    <i class="fas fa-edit text-sm"></i>
                                </button>
                                <button onclick="confirmDelete('${order.id}')" class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Hapus Order">
                                    <i class="fas fa-trash-alt text-sm"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            }
            updateStats();
        }

        function updateStats() {
            const totalOrders = orders.length;
            const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.totalProyek) || 0), 0);
            
            const dpsOrders = orders.filter(o => o.segmen === 'DPS');
            const dssOrders = orders.filter(o => o.segmen === 'DSS');
            const totalDPS = dpsOrders.reduce((acc, o) => acc + (Number(o.totalProyek) || 0), 0);
            const totalDSS = dssOrders.reduce((acc, o) => acc + (Number(o.totalProyek) || 0), 0);

            const totalBulanan = orders.reduce((acc, o) => acc + (Number(o.bulanan) || 0), 0);
            const billcomSelesai = orders.filter(o => o.billcom && o.billcom !== '').length;
            const provcomPending = orders.filter(o => !o.provcom || o.provcom === '').length;

            document.getElementById('statTotalOrders').innerText = totalOrders;
            document.getElementById('statTotalRevenue').innerText = formatRupiah(totalRevenue);
            
            document.getElementById('statTotalDPS').innerText = formatRupiah(totalDPS);
            document.getElementById('statCountDPS').innerText = `${dpsOrders.length} Order DPS`;
            
            document.getElementById('statTotalDSS').innerText = formatRupiah(totalDSS);
            document.getElementById('statCountDSS').innerText = `${dssOrders.length} Order DSS`;

            document.getElementById('statTotalBulanan').innerText = formatRupiah(totalBulanan);
            document.getElementById('statBillcomSelesai').innerText = `${billcomSelesai} / ${totalOrders}`;
            document.getElementById('statProvcomPendingInfo').innerText = `${provcomPending} Belum Provcom`;
        }

        function calculateTotalProyek() {
            const otc = parseFloat(document.getElementById('otc').value) || 0;
            const bulanan = parseFloat(document.getElementById('bulanan').value) || 0;
            const durasi = parseInt(document.getElementById('durasi').value) || 0;
            const total = otc + (bulanan * durasi);
            document.getElementById('totalProyek').value = total;
        }

        function openModal(mode, id = null) {
            const orderModal = document.getElementById('orderModal');
            const orderModalContent = document.getElementById('orderModalContent');
            const modalTitle = document.getElementById('modalTitle');
            const form = document.getElementById('orderForm');

            orderModal.classList.remove('hidden');
            setTimeout(() => {
                orderModalContent.classList.remove('modal-exit-active', 'modal-exit', 'modal-enter');
                orderModalContent.classList.add('modal-enter-active');
            }, 10);

            if (mode === 'add') {
                modalTitle.innerText = 'Tambah Order Enterprise Baru';
                form.reset();
                currentEditingId = null;
                document.getElementById('orderId').value = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
                document.getElementById('idLop').value = 'LOP-2026-' + Math.floor(1000 + Math.random() * 9000);
                document.getElementById('ccNipnas').value = '';
                document.getElementById('segmen').value = 'DPS';
                document.getElementById('kategori').value = 'PSB';
                document.getElementById('status').value = 'Inprogress';
                document.getElementById('durasi').value = 12;
                document.getElementById('otc').value = 0;
                document.getElementById('bulanan').value = 0;
                document.getElementById('reviewKontrak').value = '';
                document.getElementById('keterangan').value = '';
                calculateTotalProyek();
            } else if (mode === 'edit') {
                modalTitle.innerText = 'Edit Data Order & Kontrak';
                currentEditingId = id;
                const o = orders.find(item => item.id === id);
                if (o) {
                    document.getElementById('orderId').value = o.id;
                    document.getElementById('idLop').value = o.idLop || '';
                    document.getElementById('customer').value = o.customer || '';
                    document.getElementById('ccNipnas').value = o.ccNipnas || '';
                    document.getElementById('segmen').value = o.segmen || 'DPS';
                    document.getElementById('kategori').value = o.kategori || 'PSB';
                    document.getElementById('produk').value = o.produk || '';
                    document.getElementById('bw').value = o.bw || '';
                    document.getElementById('durasi').value = o.durasi || 12;
                    document.getElementById('quote').value = o.quote || '';
                    document.getElementById('orderNo').value = o.orderNo || '';
                    document.getElementById('sid').value = o.sid || '';
                    document.getElementById('ba').value = o.ba || '';
                    document.getElementById('otc').value = o.otc || 0;
                    document.getElementById('bulanan').value = o.bulanan || 0;
                    document.getElementById('totalProyek').value = o.totalProyek || 0;
                    document.getElementById('provcom').value = o.provcom || '';
                    document.getElementById('billcom').value = o.billcom || '';
                    document.getElementById('status').value = o.status || 'Inprogress';
                    document.getElementById('noKontrak').value = o.noKontrak || '';
                    document.getElementById('reviewKontrak').value = o.reviewKontrak || '';
                    document.getElementById('startDate').value = o.startDate || '';
                    document.getElementById('endDate').value = o.endDate || '';
                    document.getElementById('keterangan').value = o.keterangan || '';
                }
            }
        }

        function closeModal() {
            const orderModal = document.getElementById('orderModal');
            const orderModalContent = document.getElementById('orderModalContent');
            orderModalContent.classList.remove('modal-enter-active');
            orderModalContent.classList.add('modal-exit-active');
            setTimeout(() => {
                orderModal.classList.add('hidden');
            }, 200);
        }

        const orderFormEl = document.getElementById('orderForm');
        if (orderFormEl) {
            orderFormEl.addEventListener('submit', async function(e) {
                e.preventDefault();

                const otcVal = parseFloat(document.getElementById('otc').value) || 0;
                const bulananVal = parseFloat(document.getElementById('bulanan').value) || 0;
                const durasiVal = parseInt(document.getElementById('durasi').value) || 0;
                const totalProyekVal = otcVal + (bulananVal * durasiVal);

                const formData = {
                    id: document.getElementById('orderId').value,
                    idLop: document.getElementById('idLop').value,
                    customer: document.getElementById('customer').value,
                    ccNipnas: document.getElementById('ccNipnas').value,
                    segmen: document.getElementById('segmen').value,
                    kategori: document.getElementById('kategori').value,
                    produk: document.getElementById('produk').value,
                    bw: document.getElementById('bw').value,
                    durasi: durasiVal,
                    quote: document.getElementById('quote').value,
                    orderNo: document.getElementById('orderNo').value,
                    sid: document.getElementById('sid').value,
                    ba: document.getElementById('ba').value,
                    otc: otcVal,
                    bulanan: bulananVal,
                    totalProyek: totalProyekVal,
                    provcom: document.getElementById('provcom').value,
                    billcom: document.getElementById('billcom').value,
                    status: document.getElementById('status').value,
                    noKontrak: document.getElementById('noKontrak').value,
                    reviewKontrak: document.getElementById('reviewKontrak').value,
                    startDate: document.getElementById('startDate').value,
                    endDate: document.getElementById('endDate').value,
                    keterangan: document.getElementById('keterangan').value
                };

                // Simpan ke Cloud Database
                if (db && currentUser) {
                    try {
                        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', formData.id);
                        await setDoc(docRef, formData);
                        showToast('Data order tersimpan secara permanen ke Cloud!', 'success');
                    } catch (err) {
                        console.error("Gagal simpan ke Cloud:", err);
                        showToast('Gagal menyimpan ke Cloud. Tersimpan lokal.', 'error');
                    }
                } else {
                    if (currentEditingId) {
                        const idx = orders.findIndex(o => o.id === currentEditingId);
                        if (idx !== -1) orders[idx] = formData;
                    } else {
                        orders.unshift(formData);
                    }
                    applyFilters();
                    showToast('Order tersimpan di sesi lokal!', 'success');
                }

                closeModal();
            });
        }

        function viewDetail(id) {
            const o = orders.find(item => item.id === id);
            if (!o) return;

            const detailBody = document.getElementById('detailModalBody');
            document.getElementById('detailIdRef').innerText = `Reference ID: ${o.id}`;

            detailBody.innerHTML = `
                <div class="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-[10px] text-indigo-300 font-bold uppercase">${o.idLop}</span>
                            <span class="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase">${o.segmen || 'DPS'}</span>
                        </div>
                        <h3 class="text-base font-bold">${o.customer}</h3>
                        <p class="text-xs text-slate-300 mt-0.5">${o.produk} (${o.bw || 'N/A'})</p>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] text-slate-400 block">Total Nilai Proyek</span>
                        <span class="text-lg font-bold text-amber-400">${formatRupiah(o.totalProyek)}</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <h4 class="font-bold text-slate-700 text-[11px] uppercase mb-2 border-b pb-1">Spesifikasi Segmen & Layanan</h4>
                        <p><strong>CC Nipnas:</strong> <span class="font-mono text-slate-800">${o.ccNipnas || '-'}</span></p>
                        <p class="mt-1"><strong>Segmen Portfolio:</strong> <span class="text-indigo-700 font-bold">${o.segmen || 'DPS'}</span></p>
                        <p class="mt-1"><strong>Kategori Order:</strong> ${o.kategori}</p>
                        <p class="mt-1"><strong>Bandwidth:</strong> ${o.bw || '-'}</p>
                        <p class="mt-1"><strong>Durasi Kontrak:</strong> ${o.durasi} Bulan</p>
                        <p class="mt-1"><strong>SID (Service ID):</strong> ${o.sid || '-'}</p>
                    </div>

                    <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <h4 class="font-bold text-slate-700 text-[11px] uppercase mb-2 border-b pb-1">Dokumen & Referensi</h4>
                        <p><strong>No. Quote:</strong> ${o.quote || '-'}</p>
                        <p class="mt-1"><strong>No. Order / WO:</strong> ${o.orderNo || '-'}</p>
                        <p class="mt-1"><strong>Billing Account:</strong> ${o.ba || '-'}</p>
                        <p class="mt-1"><strong>No. Kontrak:</strong> ${o.noKontrak || '-'}</p>
                    </div>

                    <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <h4 class="font-bold text-slate-700 text-[11px] uppercase mb-2 border-b pb-1">Rincian Finansial</h4>
                        <p><strong>Biaya OTC:</strong> ${formatRupiah(o.otc)}</p>
                        <p class="mt-1"><strong>Biaya Bulanan (MRC):</strong> ${formatRupiah(o.bulanan)} / bln</p>
                        <p class="mt-1 font-bold text-indigo-700"><strong>Total Proyek:</strong> ${formatRupiah(o.totalProyek)}</p>
                    </div>

                    <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <h4 class="font-bold text-slate-700 text-[11px] uppercase mb-2 border-b pb-1">Status Operational & Legal</h4>
                        <p><strong>Status Order:</strong> ${o.status}</p>
                        <p class="mt-1"><strong>Tgl Provcom:</strong> ${formatDate(o.provcom)}</p>
                        <p class="mt-1"><strong>Tgl Billcom:</strong> ${formatDate(o.billcom)}</p>
                        <p class="mt-1"><strong>Review Kontrak:</strong> ${o.reviewKontrak ? `<a href="${o.reviewKontrak}" target="_blank" class="text-indigo-600 underline">Link Kontrak</a>` : '-'}</p>
                        <p class="mt-1"><strong>Periode:</strong> ${formatDate(o.startDate)} s/d ${formatDate(o.endDate)}</p>
                    </div>
                </div>

                <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <h4 class="font-bold text-slate-700 text-[11px] uppercase mb-1 border-b pb-1">Keterangan / Catatan Tambahan</h4>
                    <p class="text-slate-700 leading-relaxed">${o.keterangan || '-'}</p>
                </div>
            `;

            const detailModal = document.getElementById('detailModal');
            const detailModalContent = document.getElementById('detailModalContent');
            detailModal.classList.remove('hidden');
            setTimeout(() => {
                detailModalContent.classList.remove('modal-exit-active', 'modal-exit', 'modal-enter');
                detailModalContent.classList.add('modal-enter-active');
            }, 10);
        }

        function closeDetailModal() {
            const detailModal = document.getElementById('detailModal');
            const detailModalContent = document.getElementById('detailModalContent');
            detailModalContent.classList.remove('modal-enter-active');
            detailModalContent.classList.add('modal-exit-active');
            setTimeout(() => {
                detailModal.classList.add('hidden');
            }, 200);
        }

        function confirmDelete(id) {
            itemToDelete = id;
            document.getElementById('deleteModal').classList.remove('hidden');
        }

        function closeDeleteModal() {
            document.getElementById('deleteModal').classList.add('hidden');
            itemToDelete = null;
        }

        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', async function() {
                if (itemToDelete) {
                    if (db && currentUser) {
                        try {
                            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', itemToDelete);
                            await deleteDoc(docRef);
                            showToast('Order berhasil dihapus dari Cloud!', 'success');
                        } catch (err) {
                            console.error("Gagal hapus dari Cloud:", err);
                            showToast('Gagal menghapus dari Cloud.', 'error');
                        }
                    } else {
                        orders = orders.filter(o => o.id !== itemToDelete);
                        applyFilters();
                        showToast('Order berhasil dihapus.', 'error');
                    }
                    closeDeleteModal();
                }
            });
        }

        const searchInputEl = document.getElementById('searchInput');
        if (searchInputEl) {
            searchInputEl.addEventListener('input', applyFilters);
        }

        function applyFilters() {
            const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
            const segFilter = document.getElementById('filterSegmen')?.value || '';
            const katFilter = document.getElementById('filterKategori')?.value || '';
            const statusFilter = document.getElementById('filterStatus')?.value || '';

            const filtered = orders.filter(o => {
                const matchSearch = (
                    (o.customer && o.customer.toLowerCase().includes(searchTerm)) ||
                    (o.idLop && o.idLop.toLowerCase().includes(searchTerm)) ||
                    (o.ccNipnas && o.ccNipnas.toLowerCase().includes(searchTerm)) ||
                    (o.sid && o.sid.toLowerCase().includes(searchTerm)) ||
                    (o.segmen && o.segmen.toLowerCase().includes(searchTerm)) ||
                    (o.noKontrak && o.noKontrak.toLowerCase().includes(searchTerm)) ||
                    (o.produk && o.produk.toLowerCase().includes(searchTerm)) ||
                    (o.keterangan && o.keterangan.toLowerCase().includes(searchTerm))
                );

                const matchSegmen = segFilter === '' || o.segmen === segFilter;
                const matchKat = katFilter === '' || o.kategori === katFilter;
                const matchStatus = statusFilter === '' || o.status === statusFilter;

                return matchSearch && matchSegmen && matchKat && matchStatus;
            });

            renderTable(filtered);
        }

        function exportToCSV() {
            if (orders.length === 0) {
                showToast('Tidak ada data order untuk diekspor.', 'error');
                return;
            }

            const headers = [
                'ID Order', 'ID LOP', 'Nama Pelanggan', 'CC Nipnas', 'Segmen (DPS/DSS)', 'Kategori', 'Produk', 'Bandwidth', 
                'Durasi (Bulan)', 'No Quote', 'No Order', 'SID', 'Billing Account', 'OTC', 'Bulanan', 
                'Total Proyek', 'Tgl Provcom', 'Tgl Billcom', 'Status Order', 'No Kontrak', 
                'Review Kontrak Link', 'Start Date', 'End Date', 'Keterangan'
            ];

            const csvRows = [];
            csvRows.push(headers.join(','));

            orders.forEach(o => {
                const row = [
                    `"${o.id}"`,
                    `"${o.idLop || ''}"`,
                    `"${o.customer || ''}"`,
                    `"${o.ccNipnas || ''}"`,
                    `"${o.segmen || 'DPS'}"`,
                    `"${o.kategori || ''}"`,
                    `"${o.produk || ''}"`,
                    `"${o.bw || ''}"`,
                    o.durasi || 0,
                    `"${o.quote || ''}"`,
                    `"${o.orderNo || ''}"`,
                    `"${o.sid || ''}"`,
                    `"${o.ba || ''}"`,
                    o.otc || 0,
                    o.bulanan || 0,
                    o.totalProyek || 0,
                    `"${o.provcom || ''}"`,
                    `"${o.billcom || ''}"`,
                    `"${o.status || ''}"`,
                    `"${o.noKontrak || ''}"`,
                    `"${o.reviewKontrak || ''}"`,
                    `"${o.startDate || ''}"`,
                    `"${o.endDate || ''}"`,
                    `"${(o.keterangan || '').replace(/"/g, '""')}"`
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `Order_Pelanggan_Enterprise_DPS_DSS_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('File CSV DPS & DSS berhasil diunduh!', 'success');
        }

        function showToast(msg, type = 'success') {
            const toast = document.getElementById('toast');
            const toastMessage = document.getElementById('toastMessage');
            const toastIcon = document.getElementById('toastIcon');

            if (!toast) return;

            toastMessage.innerText = msg;
            if (type === 'success') {
                toastIcon.className = 'fas fa-check-circle text-emerald-400 mr-2.5 text-base';
            } else {
                toastIcon.className = 'fas fa-exclamation-circle text-rose-400 mr-2.5 text-base';
            }

            toast.classList.remove('translate-y-20', 'opacity-0');
            setTimeout(() => {
                toast.classList.add('translate-y-20', 'opacity-0');
            }, 3000);
        }

        function openAIModal() {
            const aiModal = document.getElementById('aiModal');
            const aiModalContent = document.getElementById('aiModalContent');
            aiModal.classList.remove('hidden');
            setTimeout(() => {
                aiModalContent.classList.remove('modal-exit-active', 'modal-exit', 'modal-enter');
                aiModalContent.classList.add('modal-enter-active');
            }, 10);
        }

        function closeAIModal() {
            const aiModal = document.getElementById('aiModal');
            const aiModalContent = document.getElementById('aiModalContent');
            aiModalContent.classList.remove('modal-enter-active');
            aiModalContent.classList.add('modal-exit-active');
            setTimeout(() => {
                aiModal.classList.add('hidden');
            }, 200);
        }

        async function getAIInsights() {
            openAIModal();
            const aiLoading = document.getElementById('aiLoading');
            const aiResult = document.getElementById('aiResult');
            const aiError = document.getElementById('aiError');

            aiLoading.classList.remove('hidden');
            aiLoading.classList.add('flex');
            aiResult.innerHTML = '';
            aiError.classList.add('hidden');
            aiError.classList.remove('flex');

            const summaryData = orders.map(o => ({
                idLop: o.idLop,
                customer: o.customer,
                ccNipnas: o.ccNipnas,
                segmen: o.segmen || 'DPS',
                produk: o.produk,
                totalProyek: o.totalProyek,
                bulanan: o.bulanan,
                provcom: o.provcom,
                billcom: o.billcom,
                status: o.status,
                endDate: o.endDate
            }));

            const promptText = `
Anda adalah Enterprise Telecom & B2B Solutions Analyst.
Berikut adalah data order pelanggan enterprise saat ini (termasuk segmen DPS & DSS):
${JSON.stringify(summaryData)}

Silakan berikan analisis eksekutif dalam bahasa Indonesia (maksimal 3-4 paragraf ringkas):
1. **Analisis Performa Segmen DPS vs DSS**: Bandingkan total nilai proyek dan kontribusi revenue antara segmen DPS dan DSS.
2. **Evaluasi Billing Gap & Provcom**: Berikan perhatian pada order DPS/DSS mana yang sudah Provcom namun belum Billcom.
3. **Rekomendasi Strategis Portofolio**: Berikan masukan singkat untuk percepatan revenue DPS & DSS.

Gunakan format HTML rapi seperti <b>, <ul>, <li>, <p>. JANGAN gunakan markdown backticks.
            `;

            try {
                const apiKey = "";
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

                const payload = {
                    contents: [{ parts: [{ text: promptText }] }],
                    systemInstruction: {
                        parts: [{ text: "Anda adalah analis sistem manajemen order enterprise B2B profesional spesialis DPS dan DSS." }]
                    }
                };

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

                const data = await response.json();
                const candidate = data.candidates?.[0];

                if (candidate && candidate.content?.parts?.[0]?.text) {
                    let formattedText = candidate.content.parts[0].text;
                    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    formattedText = formattedText.replace(/\n\n/g, '</p><p class="mt-2">');

                    aiLoading.classList.add('hidden');
                    aiLoading.classList.remove('flex');
                    aiResult.innerHTML = `<p class="mt-1">${formattedText}</p>`;
                } else {
                    throw new Error("Respon API tidak valid");
                }
            } catch (err) {
                console.error("AI Error:", err);
                aiLoading.classList.add('hidden');
                aiLoading.classList.remove('flex');
                aiError.classList.remove('hidden');
                aiError.classList.add('flex');
                document.getElementById('aiErrorMessage').innerText = err.message || 'Gagal terhubung dengan layanan Gemini API.';
            }
        }

        // Expose fungsi ke scope global window untuk event handler HTML
        window.renderTable = renderTable;
        window.updateStats = updateStats;
        window.calculateTotalProyek = calculateTotalProyek;
        window.openModal = openModal;
        window.closeModal = closeModal;
        window.viewDetail = viewDetail;
        window.closeDetailModal = closeDetailModal;
        window.confirmDelete = confirmDelete;
        window.closeDeleteModal = closeDeleteModal;
        window.applyFilters = applyFilters;
        window.exportToCSV = exportToCSV;
        window.showToast = showToast;
        window.openAIModal = openAIModal;
        window.closeAIModal = closeAIModal;
        window.getAIInsights = getAIInsights;

        // Jalankan Inisialisasi Cloud saat Load
        window.addEventListener('load', () => {
            initCloudSync();
        });
