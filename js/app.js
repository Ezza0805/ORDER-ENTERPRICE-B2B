import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   STATE
========================================================= */

let orders = [];

let currentEditingId = null;

let itemToDelete = null;


/* =========================================================
   SUPABASE - LOAD DATA
========================================================= */

async function loadOrders() {

    console.log("Mengambil data dari Supabase...");

    const {
        data,
        error
    } = await supabase
        .from("orders")
        .select("*");

    if (error) {

        console.error(
            "SUPABASE LOAD ERROR:",
            error
        );

        const cloudStatusEl =
            document.getElementById(
                "cloudStatusText"
            );

        if (cloudStatusEl) {
            cloudStatusEl.innerText = "Offline";
        }

        showToast(
            "Gagal mengambil data dari Supabase.",
            "error"
        );

        return;
    }

    console.log("DATA SUPABASE:");
    console.table(data);

    orders = data || [];


    const cloudStatusEl =
        document.getElementById(
            "cloudStatusText"
        );

    const cloudStatusBadge =
        document.getElementById(
            "cloudStatus"
        );


    if (cloudStatusEl) {

        cloudStatusEl.innerText =
            "Supabase Connected";
    }


    if (cloudStatusBadge) {

        cloudStatusBadge.className =
            "hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold";
    }


    applyFilters();
}

function exportToExcel(event) {

    if (event) {
        event.preventDefault();
    }

    if (!orders || orders.length === 0) {

        showToast(
            "Tidak ada data untuk diekspor.",
            "error"
        );

        return;
    }

    const excelData = orders.map(order => ({

        "ID LOP": order.id_lop || "",
        "Customer": order.customer || "",
        "CC NIPNAS": order.cc_nipnas || "",
        "Segmen": order.segmen || "",
        "Kategori": order.kategori || "",
        "Produk": order.produk || "",
        "Bandwidth": order.bw || "",
        "Durasi (Bulan)": order.durasi || 0,
        "Quote": order.quote || "",
        "Order No": order.order_no || "",
        "SID": order.sid || "",
        "Billing Account": order.billing_account || "",

        "OTC": Number(order.otc) || 0,
        "Bulanan / MRC": Number(order.bulanan) || 0,
        "Total Proyek": Number(order.total_proyek) || 0,

        "Tanggal Provcom": order.provcom || "",
        "Tanggal Billcom": order.billcom || "",

        "Status": order.status || "",
        "No Kontrak": order.no_kontrak || "",
        "Review Kontrak": order.review_kontrak || "",

        "Start Date": order.start_date || "",
        "End Date": order.end_date || "",

        "Keterangan": order.keterangan || ""

    }));


    const worksheet =
        XLSX.utils.json_to_sheet(excelData);


    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Orders"
    );


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    XLSX.writeFile(
        workbook,
        `orders_${today}.xlsx`
    );


    showToast(
        `${excelData.length} data berhasil diekspor.`,
        "success"
    );
}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(num) {

    if (
        isNaN(num) ||
        num === null
    ) {

        return "Rp 0";
    }

    return "Rp " +
        Number(num).toLocaleString(
            "id-ID"
        );
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(dateStr) {

    if (!dateStr) {
        return "-";
    }

    const date =
        new Date(dateStr);

    if (
        isNaN(
            date.getTime()
        )
    ) {

        return dateStr;
    }

    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   FORMAT DATE FOR INPUT
========================================================= */

function formatDateForInput(dateValue) {

    if (!dateValue) {
        return "";
    }

    return String(
        dateValue
    ).split("T")[0];
}


/* =========================================================
   TABLE
========================================================= */

function renderTable(
    data = orders
) {

    const tableBody =
        document.getElementById(
            "orderTableBody"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    if (data.length === 0) {

        emptyState?.classList.remove(
            "hidden"
        );

        emptyState?.classList.add(
            "flex"
        );

    } else {

        emptyState?.classList.add(
            "hidden"
        );

        emptyState?.classList.remove(
            "flex"
        );


        data.forEach(
            order => {

                const getBadgeClass =
                    (status) => {

                        if (
                            status ===
                            "Completed"
                        ) {

                            return "bg-emerald-100 text-emerald-800 border-emerald-200";
                        }

                        if (
                            status ===
                            "Inprogress"
                        ) {

                            return "bg-blue-100 text-blue-800 border-blue-200";
                        }

                        if (
                            status ===
                            "Pending Baso"
                        ) {

                            return "bg-amber-100 text-amber-800 border-amber-200";
                        }

                        return "bg-slate-100 text-slate-700 border-slate-200";
                    };


                const getSegmenBadge =
                    (segmen) => {

                        if (
                            segmen ===
                            "DPS"
                        ) {

                            return "bg-indigo-100 text-indigo-800 border-indigo-300 font-bold";
                        }

                        if (
                            segmen ===
                            "DSS"
                        ) {

                            return "bg-cyan-100 text-cyan-800 border-cyan-300 font-bold";
                        }

                        return "bg-slate-100 text-slate-700 border-slate-200";
                    };


                const reviewKontrakContent =
                    order.review_kontrak
                        ? `
                            <a
                                href="${order.review_kontrak}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-indigo-600 hover:underline font-medium flex items-center gap-1"
                            >
                                <i class="fas fa-external-link-alt text-[10px]"></i>
                                Link Kontrak
                            </a>
                        `
                        : "-";


                const tr =
                    document.createElement(
                        "tr"
                    );


                tr.className =
                    "hover:bg-slate-50 transition-colors border-b border-slate-100";


                tr.innerHTML = `

                    <td class="px-4 py-3 font-semibold text-indigo-700 whitespace-nowrap">
                        ${order.id_lop || "-"}
                    </td>

                    <td
                        class="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap max-w-[200px] truncate"
                        title="${order.customer || ""}"
                    >
                        ${order.customer || "-"}
                    </td>

                    <td class="px-4 py-3 text-slate-600 font-mono whitespace-nowrap">
                        ${order.cc_nipnas || "-"}
                    </td>

                    <td class="px-4 py-3 whitespace-nowrap">

                        <span
                            class="px-2.5 py-1 rounded text-[10px] uppercase border ${getSegmenBadge(order.segmen)}"
                        >
                            ${order.segmen || "-"}
                        </span>

                    </td>

                    <td class="px-4 py-3 text-slate-600 whitespace-nowrap">

                        <span
                            class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200"
                        >
                            ${order.kategori || "-"}
                        </span>

                    </td>

                    <td
                        class="px-4 py-3 text-slate-700 font-medium whitespace-nowrap max-w-[180px] truncate"
                        title="${order.produk || ""}"
                    >
                        ${order.produk || "-"}
                    </td>

                    <td class="px-4 py-3 text-slate-600 whitespace-nowrap">
                        ${order.bw || "-"}
                    </td>

                    <td class="px-4 py-3 text-slate-600 whitespace-nowrap">
                        ${order.durasi || 0} Bln
                    </td>

                    <td class="px-4 py-3 text-slate-500 whitespace-nowrap">
                        ${order.quote || "-"}
                    </td>

                    <td class="px-4 py-3 text-slate-500 whitespace-nowrap">
                        ${order.order_no || "-"}
                    </td>

                    <td class="px-4 py-3 text-slate-600 font-mono whitespace-nowrap">
                        ${order.sid || "-"}
                    </td>

                    <td class="px-4 py-3 text-slate-600 font-mono whitespace-nowrap">
                        ${order.billing_account || "-"}
                    </td>

                    <td class="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                        ${formatRupiah(order.otc)}
                    </td>

                    <td class="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                        ${formatRupiah(order.bulanan)}
                    </td>

                    <td class="px-4 py-3 text-right font-bold text-indigo-700 whitespace-nowrap">
                        ${formatRupiah(order.total_proyek)}
                    </td>

                    <td class="px-4 py-3 text-slate-600 whitespace-nowrap">
                        ${formatDate(order.provcom)}
                    </td>

                    <td class="px-4 py-3 text-slate-600 whitespace-nowrap">
                        ${formatDate(order.billcom)}
                    </td>

                    <td class="px-4 py-3 whitespace-nowrap">

                        <span
                            class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeClass(order.status)}"
                        >
                            ${order.status || "-"}
                        </span>

                    </td>

                    <td class="px-4 py-3 text-slate-600 whitespace-nowrap">
                        ${order.no_kontrak || "-"}
                    </td>

                    <td class="px-4 py-3 whitespace-nowrap">
                        ${reviewKontrakContent}
                    </td>

                    <td class="px-4 py-3 text-slate-500 whitespace-nowrap">
                        ${formatDate(order.start_date)}
                    </td>

                    <td class="px-4 py-3 text-slate-500 whitespace-nowrap">
                        ${formatDate(order.end_date)}
                    </td>

                    <td
                        class="px-4 py-3 text-slate-600 whitespace-nowrap max-w-[180px] truncate"
                        title="${order.keterangan || "-"}"
                    >
                        ${order.keterangan || "-"}
                    </td>

                    <td class="px-4 py-3 text-center whitespace-nowrap sticky-col">

                        <div class="flex items-center justify-center space-x-1">

                            <button
                                type="button"
                                onclick="viewDetail('${order.id}')"
                                class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                title="Lihat Detail"
                            >
                                <i class="fas fa-eye text-sm"></i>
                            </button>

                            <button
                                type="button"
                                onclick="openModal('edit', '${order.id}')"
                                class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                title="Edit Order"
                            >
                                <i class="fas fa-edit text-sm"></i>
                            </button>

                            <button
                                type="button"
                                onclick="confirmDelete('${order.id}')"
                                class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Hapus Order"
                            >
                                <i class="fas fa-trash-alt text-sm"></i>
                            </button>

                        </div>

                    </td>
                `;


                tableBody.appendChild(
                    tr
                );
            }
        );
    }


    updateStats();
}


/* =========================================================
   STATISTICS
========================================================= */

function updateStats() {

    const totalOrders =
        orders.length;


    const totalRevenue =
        orders.reduce(
            (acc, order) =>
                acc +
                (
                    Number(
                        order.total_proyek
                    ) || 0
                ),
            0
        );


    const dpsOrders =
        orders.filter(
            order =>
                order.segmen === "DPS"
        );


    const dssOrders =
        orders.filter(
            order =>
                order.segmen === "DSS"
        );


    const totalDPS =
        dpsOrders.reduce(
            (acc, order) =>
                acc +
                (
                    Number(
                        order.total_proyek
                    ) || 0
                ),
            0
        );


    const totalDSS =
        dssOrders.reduce(
            (acc, order) =>
                acc +
                (
                    Number(
                        order.total_proyek
                    ) || 0
                ),
            0
        );


    const totalBulanan =
        orders.reduce(
            (acc, order) =>
                acc +
                (
                    Number(
                        order.bulanan
                    ) || 0
                ),
            0
        );


    const billcomSelesai =
        orders.filter(
            order =>
                order.billcom &&
                order.billcom !== ""
        ).length;


    const provcomPending =
        orders.filter(
            order =>
                !order.provcom ||
                order.provcom === ""
        ).length;


    document.getElementById(
        "statTotalOrders"
    )?.replaceChildren(
        document.createTextNode(
            totalOrders
        )
    );


    document.getElementById(
        "statTotalRevenue"
    )?.replaceChildren(
        document.createTextNode(
            formatRupiah(
                totalRevenue
            )
        )
    );


    document.getElementById(
        "statTotalDPS"
    )?.replaceChildren(
        document.createTextNode(
            formatRupiah(
                totalDPS
            )
        )
    );


    document.getElementById(
        "statCountDPS"
    )?.replaceChildren(
        document.createTextNode(
            `${dpsOrders.length} Order DPS`
        )
    );


    document.getElementById(
        "statTotalDSS"
    )?.replaceChildren(
        document.createTextNode(
            formatRupiah(
                totalDSS
            )
        )
    );


    document.getElementById(
        "statCountDSS"
    )?.replaceChildren(
        document.createTextNode(
            `${dssOrders.length} Order DSS`
        )
    );


    document.getElementById(
        "statTotalBulanan"
    )?.replaceChildren(
        document.createTextNode(
            formatRupiah(
                totalBulanan
            )
        )
    );


    document.getElementById(
        "statBillcomSelesai"
    )?.replaceChildren(
        document.createTextNode(
            `${billcomSelesai} / ${totalOrders}`
        )
    );


    document.getElementById(
        "statProvcomPendingInfo"
    )?.replaceChildren(
        document.createTextNode(
            `${provcomPending} Belum Provcom`
        )
    );
}


/* =========================================================
   SEARCH & FILTER
========================================================= */

function applyFilters() {

    const searchTerm =
        (
            document.getElementById(
                "searchInput"
            )?.value || ""
        ).toLowerCase();


    const segFilter =
        document.getElementById(
            "filterSegmen"
        )?.value || "";


    const katFilter =
        document.getElementById(
            "filterKategori"
        )?.value || "";


    const statusFilter =
        document.getElementById(
            "filterStatus"
        )?.value || "";


    const filtered =
        orders.filter(
            order => {

                const matchSearch = [

                    order.customer,
                    order.id_lop,
                    order.cc_nipnas,
                    order.sid,
                    order.segmen,
                    order.no_kontrak,
                    order.produk,
                    order.keterangan

                ].some(
                    value =>
                        value &&
                        String(value)
                            .toLowerCase()
                            .includes(
                                searchTerm
                            )
                );


                const matchSegmen =
                    segFilter === "" ||
                    order.segmen ===
                    segFilter;


                const matchKategori =
                    katFilter === "" ||
                    order.kategori ===
                    katFilter;


                const matchStatus =
                    statusFilter === "" ||
                    order.status ===
                    statusFilter;


                return (
                    matchSearch &&
                    matchSegmen &&
                    matchKategori &&
                    matchStatus
                );
            }
        );


    renderTable(
        filtered
    );
}


/* =========================================================
   CALCULATE TOTAL
========================================================= */

function calculateTotalProyek() {

    const otc =
        parseFloat(
            document.getElementById(
                "otc"
            )?.value
        ) || 0;


    const bulanan =
        parseFloat(
            document.getElementById(
                "bulanan"
            )?.value
        ) || 0;


    const durasi =
        parseInt(
            document.getElementById(
                "durasi"
            )?.value
        ) || 0;


    const total =
        otc +
        (
            bulanan *
            durasi
        );


    const totalElement =
        document.getElementById(
            "totalProyek"
        );


    if (totalElement) {

        totalElement.value =
            total;
    }
}


/* =========================================================
   SET INPUT VALUE
========================================================= */

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        console.warn(
            `Element #${id} tidak ditemukan.`
        );

        return;
    }


    element.value =
        value ?? "";
}


/* =========================================================
   UPDATE ORDER
========================================================= */

async function updateOrder() {

    if (!currentEditingId) {

        showToast(
            "Tidak ada order yang sedang diedit.",
            "error"
        );

        return;
    }


    const updatedOrder = {

        id_lop:
            document.getElementById(
                "idLop"
            )?.value || null,

        customer:
            document.getElementById(
                "customer"
            )?.value || null,

        cc_nipnas:
            document.getElementById(
                "ccNipnas"
            )?.value || null,

        segmen:
            document.getElementById(
                "segmen"
            )?.value || null,

        kategori:
            document.getElementById(
                "kategori"
            )?.value || null,

        produk:
            document.getElementById(
                "produk"
            )?.value || null,

        bw:
            document.getElementById(
                "bw"
            )?.value || null,

        durasi:
            Number(
                document.getElementById(
                    "durasi"
                )?.value
            ) || 0,

        quote:
            document.getElementById(
                "quote"
            )?.value || null,

        order_no:
            document.getElementById(
                "orderNo"
            )?.value || null,

        sid:
            document.getElementById(
                "sid"
            )?.value || null,

        billing_account:
            document.getElementById(
                "ba"
            )?.value || null,

        otc:
            Number(
                document.getElementById(
                    "otc"
                )?.value
            ) || 0,

        bulanan:
            Number(
                document.getElementById(
                    "bulanan"
                )?.value
            ) || 0,

        total_proyek:
            Number(
                document.getElementById(
                    "totalProyek"
                )?.value
            ) || 0,

        provcom:
            document.getElementById(
                "provcom"
            )?.value || null,

        billcom:
            document.getElementById(
                "billcom"
            )?.value || null,

        status:
            document.getElementById(
                "status"
            )?.value || null,

        no_kontrak:
            document.getElementById(
                "noKontrak"
            )?.value || null,

        review_kontrak:
            document.getElementById(
                "reviewKontrak"
            )?.value || null,

        start_date:
            document.getElementById(
                "startDate"
            )?.value || null,

        end_date:
            document.getElementById(
                "endDate"
            )?.value || null,

        keterangan:
            document.getElementById(
                "keterangan"
            )?.value || null
    };


    console.log(
        "===================================="
    );

    console.log(
        "UPDATE ORDER"
    );

    console.log(
        "ID:",
        currentEditingId
    );

    console.table(
        updatedOrder
    );

    console.log(
        "===================================="
    );


    const {
        data,
        error
    } = await supabase
        .from("orders")
        .update(updatedOrder)
        .eq(
            "id",
            currentEditingId
        )
        .select();


    if (error) {

        console.error(
            "SUPABASE UPDATE ERROR:",
            error
        );

        showToast(
            `Gagal mengupdate data: ${error.message}`,
            "error"
        );

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        console.error(
            "UPDATE TIDAK MENGEMBALIKAN DATA"
        );

        showToast(
            "Data tidak berubah. Periksa RLS UPDATE.",
            "error"
        );

        return;
    }


    console.log(
        "ORDER BERHASIL DIUPDATE:"
    );

    console.table(data);


    showToast(
        "Order berhasil diperbarui.",
        "success"
    );


    closeModal();


    currentEditingId =
        null;


    await loadOrders();
}


/* =========================================================
   ADD ORDER
========================================================= */

async function addOrder() {

    const newOrder = {

        id:
            document.getElementById(
                "orderId"
            )?.value ||
            crypto.randomUUID(),

        id_lop:
            document.getElementById(
                "idLop"
            )?.value || null,

        customer:
            document.getElementById(
                "customer"
            )?.value || null,

        cc_nipnas:
            document.getElementById(
                "ccNipnas"
            )?.value || null,

        segmen:
            document.getElementById(
                "segmen"
            )?.value || null,

        kategori:
            document.getElementById(
                "kategori"
            )?.value || null,

        produk:
            document.getElementById(
                "produk"
            )?.value || null,

        bw:
            document.getElementById(
                "bw"
            )?.value || null,

        durasi:
            Number(
                document.getElementById(
                    "durasi"
                )?.value
            ) || 0,

        quote:
            document.getElementById(
                "quote"
            )?.value || null,

        order_no:
            document.getElementById(
                "orderNo"
            )?.value || null,

        sid:
            document.getElementById(
                "sid"
            )?.value || null,

        billing_account:
            document.getElementById(
                "ba"
            )?.value || null,

        otc:
            Number(
                document.getElementById(
                    "otc"
                )?.value
            ) || 0,

        bulanan:
            Number(
                document.getElementById(
                    "bulanan"
                )?.value
            ) || 0,

        total_proyek:
            Number(
                document.getElementById(
                    "totalProyek"
                )?.value
            ) || 0,

        provcom:
            document.getElementById(
                "provcom"
            )?.value || null,

        billcom:
            document.getElementById(
                "billcom"
            )?.value || null,

        status:
            document.getElementById(
                "status"
            )?.value || null,

        no_kontrak:
            document.getElementById(
                "noKontrak"
            )?.value || null,

        review_kontrak:
            document.getElementById(
                "reviewKontrak"
            )?.value || null,

        start_date:
            document.getElementById(
                "startDate"
            )?.value || null,

        end_date:
            document.getElementById(
                "endDate"
            )?.value || null,

        keterangan:
            document.getElementById(
                "keterangan"
            )?.value || null
    };


    console.log(
        "DATA ORDER BARU:"
    );

    console.table(
        newOrder
    );


    const {
        data,
        error
    } = await supabase
        .from("orders")
        .insert(newOrder)
        .select();


    if (error) {

        console.error(
            "SUPABASE INSERT ERROR:",
            error
        );

        showToast(
            `Gagal menambahkan order: ${error.message}`,
            "error"
        );

        return;
    }


    console.log(
        "ORDER BERHASIL DITAMBAHKAN:"
    );

    console.table(data);


    showToast(
        "Order berhasil ditambahkan.",
        "success"
    );


    closeModal();


    await loadOrders();
}


/* =========================================================
   DELETE CONFIRMATION
========================================================= */

function confirmDelete(id) {

    console.log(
        "===================================="
    );

    console.log(
        "CONFIRM DELETE:",
        id
    );

    console.log(
        "===================================="
    );


    const order =
        orders.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );


    if (!order) {

        console.error(
            "Order tidak ditemukan:",
            id
        );

        showToast(
            "Data order tidak ditemukan.",
            "error"
        );

        return;
    }


    /*
       SIMPAN ID YANG AKAN DIHAPUS
    */

    itemToDelete =
        id;


    console.log(
        "itemToDelete =",
        itemToDelete
    );


    /*
       CARI DELETE MODAL
    */

    const deleteModal =
        document.getElementById(
            "deleteModal"
        );


    /*
       JIKA MODAL TIDAK ADA,
       LANGSUNG CONFIRM BROWSER
    */

    if (!deleteModal) {

        console.warn(
            "deleteModal tidak ditemukan."
        );


        const confirmed =
            window.confirm(
                `Yakin ingin menghapus order ini?\n\n` +
                `Customer: ${order.customer || "-"}\n` +
                `ID LOP: ${order.id_lop || "-"}\n\n` +
                `Data yang dihapus tidak dapat dikembalikan.`
            );


        if (!confirmed) {

            itemToDelete =
                null;

            return;
        }


        console.log(
            "USER MEMILIH YES"
        );


        deleteOrder(id);

        return;
    }


    /*
       ISI DATA MODAL
    */

    const deleteCustomer =
        document.getElementById(
            "deleteCustomer"
        );


    const deleteLop =
        document.getElementById(
            "deleteLop"
        );


    if (deleteCustomer) {

        deleteCustomer.innerText =
            order.customer || "-";
    }


    if (deleteLop) {

        deleteLop.innerText =
            order.id_lop || "-";
    }


    /*
       TAMPILKAN MODAL
    */

    deleteModal.classList.remove(
        "hidden"
    );


    /*
       =====================================================
       FIX PENTING
       =====================================================

       Pastikan tombol "YA, HAPUS" memanggil deleteOrder().
    */

    setupDeleteConfirmButton();


    console.log(
        "Delete modal dibuka."
    );

    console.log(
        "Klik tombol YA/HAPUS untuk menjalankan deleteOrder()."
    );
}


/* =========================================================
   SETUP DELETE CONFIRM BUTTON
========================================================= */

function setupDeleteConfirmButton() {

    const deleteModal =
        document.getElementById(
            "deleteModal"
        );


    if (!deleteModal) {

        console.warn(
            "deleteModal tidak ditemukan."
        );

        return;
    }


    /*
       Prioritas 1:
       cari ID tombol yang umum digunakan
    */

    const possibleIds = [
        "confirmDeleteBtn",
        "confirmDelete",
        "deleteConfirmBtn",
        "btnConfirmDelete",
        "btnDeleteConfirm",
        "yesDeleteBtn",
        "confirmDeleteButton"
    ];


    let confirmButton = null;


    for (
        const id of possibleIds
    ) {

        const button =
            document.getElementById(id);


        if (
            button &&
            deleteModal.contains(button)
        ) {

            confirmButton =
                button;

            console.log(
                "Tombol delete ditemukan berdasarkan ID:",
                id
            );

            break;
        }
    }


    /*
       Prioritas 2:
       cari tombol berdasarkan text
    */

    if (!confirmButton) {

        const buttons =
            deleteModal.querySelectorAll(
                "button"
            );


        for (
            const button of buttons
        ) {

            const text =
                (
                    button.innerText ||
                    button.textContent ||
                    ""
                )
                .trim()
                .toLowerCase();


            /*
               Cari tombol yang mengandung
               "hapus", "ya, hapus", dsb.
            */

            if (
                text.includes("hapus") ||
                text === "ya" ||
                text.includes("confirm")
            ) {

                /*
                   Jangan pilih tombol batal
                */

                if (
                    text.includes("batal") ||
                    text.includes("cancel")
                ) {

                    continue;
                }


                confirmButton =
                    button;

                console.log(
                    "Tombol delete ditemukan berdasarkan text:",
                    text
                );

                break;
            }
        }
    }


    if (!confirmButton) {

        console.error(
            "TOMBOL KONFIRMASI DELETE TIDAK DITEMUKAN!"
        );

        console.error(
            "Pastikan tombol Ya/Hapus berada di dalam #deleteModal."
        );

        return;
    }


    /*
       Hapus event lama
       dengan clone node
    */

    const newButton =
        confirmButton.cloneNode(true);


    confirmButton.parentNode.replaceChild(
        newButton,
        confirmButton
    );


    /*
       Pasang event baru
    */

    newButton.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();

            event.stopPropagation();


            console.log(
                "===================================="
            );

            console.log(
                "TOMBOL YA/HAPUS DIKLIK"
            );

            console.log(
                "itemToDelete:",
                itemToDelete
            );

            console.log(
                "===================================="
            );


            if (!itemToDelete) {

                console.error(
                    "itemToDelete kosong."
                );

                showToast(
                    "Tidak ada order yang dipilih.",
                    "error"
                );

                return;
            }


            await deleteOrder(
                itemToDelete
            );
        }
    );


    console.log(
        "Event tombol delete berhasil dipasang."
    );
}


/* =========================================================
   DELETE ORDER - SUPABASE
========================================================= */

async function deleteOrder(
    id = itemToDelete
) {

    console.log(
        "===================================="
    );

    console.log(
        "DELETE ORDER DIPANGGIL"
    );

    console.log(
        "ID:",
        id
    );

    console.log(
        "===================================="
    );


    /*
       VALIDASI ID
    */

    if (!id) {

        console.error(
            "ID DELETE KOSONG."
        );

        showToast(
            "Tidak ada order yang dipilih.",
            "error"
        );

        return;
    }


    /*
       DISABLE SEMUA TOMBOL DELETE
    */

    const deleteButtons =
        document.querySelectorAll(
            '[title="Hapus Order"]'
        );


    deleteButtons.forEach(
        button => {

            button.disabled =
                true;

            button.classList.add(
                "opacity-50",
                "cursor-not-allowed"
            );
        }
    );


    /*
       DISABLE TOMBOL KONFIRMASI
    */

    const deleteModal =
        document.getElementById(
            "deleteModal"
        );


    let confirmButton = null;


    if (deleteModal) {

        const buttons =
            deleteModal.querySelectorAll(
                "button"
            );


        for (
            const button of buttons
        ) {

            const text =
                (
                    button.innerText ||
                    button.textContent ||
                    ""
                )
                .toLowerCase();


            if (
                (
                    text.includes("hapus") ||
                    text === "ya"
                ) &&
                !text.includes("batal") &&
                !text.includes("cancel")
            ) {

                confirmButton =
                    button;

                break;
            }
        }
    }


    if (confirmButton) {

        confirmButton.disabled =
            true;

        confirmButton.classList.add(
            "opacity-50",
            "cursor-not-allowed"
        );
    }


    /*
       =====================================================
       DELETE SUPABASE
       =====================================================

       PENTING:
       Tidak menggunakan .select()
       */

    console.log(
        "Mengirim DELETE ke Supabase..."
    );


    const {
        error
    } = await supabase
        .from("orders")
        .delete()
        .eq(
            "id",
            id
        );


    /*
       AKTIFKAN KEMBALI TOMBOL
    */

    deleteButtons.forEach(
        button => {

            button.disabled =
                false;

            button.classList.remove(
                "opacity-50",
                "cursor-not-allowed"
            );
        }
    );


    if (confirmButton) {

        confirmButton.disabled =
            false;

        confirmButton.classList.remove(
            "opacity-50",
            "cursor-not-allowed"
        );
    }


    /*
       =====================================================
       ERROR
    =====================================================
    */

    if (error) {

        console.error(
            "===================================="
        );

        console.error(
            "SUPABASE DELETE ERROR"
        );

        console.error(
            "MESSAGE:",
            error.message
        );

        console.error(
            "DETAILS:",
            error.details
        );

        console.error(
            "HINT:",
            error.hint
        );

        console.error(
            "CODE:",
            error.code
        );

        console.error(
            "===================================="
        );


        showToast(
            `Gagal menghapus order: ${error.message}`,
            "error"
        );


        return;
    }


    /*
       =====================================================
       DELETE BERHASIL
       =====================================================
    */

    console.log(
        "===================================="
    );

    console.log(
        "ORDER BERHASIL DIHAPUS"
    );

    console.log(
        "ID:",
        id
    );

    console.log(
        "===================================="
    );


    /*
       Hapus langsung dari state lokal
       supaya UI langsung berubah
    */

    orders =
        orders.filter(
            order =>
                String(order.id) !==
                String(id)
        );


    /*
       Tutup modal
    */

    closeDeleteModal();


    /*
       Reset ID
    */

    itemToDelete =
        null;


    /*
       Render ulang
    */

    applyFilters();


    /*
       Update statistik
    */

    updateStats();


    /*
       Toast
    */

    showToast(
        "Order berhasil dihapus.",
        "success"
    );


    /*
       Ambil data terbaru dari Supabase
       untuk memastikan data benar-benar hilang
    */

    await loadOrders();
}


/* =========================================================
   CLOSE DELETE MODAL
========================================================= */

function closeDeleteModal() {

    const deleteModal =
        document.getElementById(
            "deleteModal"
        );


    if (!deleteModal) {
        return;
    }


    deleteModal.classList.add(
        "hidden"
    );


    itemToDelete =
        null;


    console.log(
        "Delete modal ditutup."
    );
}


/* =========================================================
   OPEN MODAL
========================================================= */

function openModal(
    mode,
    id = null
) {

    const orderModal =
        document.getElementById(
            "orderModal"
        );


    const orderModalContent =
        document.getElementById(
            "orderModalContent"
        );


    const modalTitle =
        document.getElementById(
            "modalTitle"
        );


    const form =
        document.getElementById(
            "orderForm"
        );


    if (
        !orderModal ||
        !orderModalContent
    ) {

        console.error(
            "Modal order tidak ditemukan."
        );

        return;
    }


    orderModal.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            orderModalContent.classList.remove(
                "modal-exit-active",
                "modal-exit",
                "modal-enter"
            );


            orderModalContent.classList.add(
                "modal-enter-active"
            );

        },
        10
    );


    /* =====================================================
       TAMBAH
    ===================================================== */

    if (
        mode === "add"
    ) {

        if (modalTitle) {

            modalTitle.innerText =
                "Tambah Order Enterprise Baru";
        }


        if (form) {

            form.reset();
        }


        currentEditingId =
            null;


        setInputValue(
            "orderId",
            "ORD-" +
            Math.floor(
                1000 +
                Math.random() *
                9000
            )
        );


        setInputValue(
            "idLop",
            "LOP-2026-" +
            Math.floor(
                1000 +
                Math.random() *
                9000
            )
        );


        setInputValue(
            "segmen",
            "DPS"
        );


        setInputValue(
            "kategori",
            "PSB"
        );


        setInputValue(
            "status",
            "Inprogress"
        );


        setInputValue(
            "durasi",
            12
        );


        setInputValue(
            "otc",
            0
        );


        setInputValue(
            "bulanan",
            0
        );


        calculateTotalProyek();


        return;
    }


    /* =====================================================
       EDIT
    ===================================================== */

    if (
        mode === "edit"
    ) {

        if (modalTitle) {

            modalTitle.innerText =
                "Edit Data Order & Kontrak";
        }


        currentEditingId =
            id;


        const order =
            orders.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        id
                    )
            );


        if (!order) {

            console.error(
                "Order tidak ditemukan:",
                id
            );


            showToast(
                "Data order tidak ditemukan.",
                "error"
            );


            return;
        }


        console.log(
            "Edit order:",
            order
        );


        setInputValue(
            "orderId",
            order.id
        );


        setInputValue(
            "idLop",
            order.id_lop
        );


        setInputValue(
            "customer",
            order.customer
        );


        setInputValue(
            "ccNipnas",
            order.cc_nipnas
        );


        setInputValue(
            "segmen",
            order.segmen
        );


        setInputValue(
            "kategori",
            order.kategori
        );


        setInputValue(
            "produk",
            order.produk
        );


        setInputValue(
            "bw",
            order.bw
        );


        setInputValue(
            "durasi",
            order.durasi
        );


        setInputValue(
            "quote",
            order.quote
        );


        setInputValue(
            "orderNo",
            order.order_no
        );


        setInputValue(
            "sid",
            order.sid
        );


        setInputValue(
            "ba",
            order.billing_account
        );


        setInputValue(
            "otc",
            order.otc
        );


        setInputValue(
            "bulanan",
            order.bulanan
        );


        setInputValue(
            "totalProyek",
            order.total_proyek
        );


        setInputValue(
            "provcom",
            formatDateForInput(
                order.provcom
            )
        );


        setInputValue(
            "billcom",
            formatDateForInput(
                order.billcom
            )
        );


        setInputValue(
            "status",
            order.status
        );


        setInputValue(
            "noKontrak",
            order.no_kontrak
        );


        setInputValue(
            "reviewKontrak",
            order.review_kontrak
        );


        setInputValue(
            "startDate",
            formatDateForInput(
                order.start_date
            )
        );


        setInputValue(
            "endDate",
            formatDateForInput(
                order.end_date
            )
        );


        setInputValue(
            "keterangan",
            order.keterangan
        );
    }
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    const orderModal =
        document.getElementById(
            "orderModal"
        );


    const orderModalContent =
        document.getElementById(
            "orderModalContent"
        );


    if (
        !orderModal ||
        !orderModalContent
    ) {

        return;
    }


    orderModalContent.classList.remove(
        "modal-enter-active"
    );


    orderModalContent.classList.add(
        "modal-exit-active"
    );


    setTimeout(
        () => {

            orderModal.classList.add(
                "hidden"
            );

        },
        200
    );
}


/* =========================================================
   VIEW DETAIL
========================================================= */

function viewDetail(
    id
) {

    const order =
        orders.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );


    if (!order) {

        console.error(
            "Order tidak ditemukan:",
            id
        );


        showToast(
            "Data order tidak ditemukan.",
            "error"
        );


        return;
    }


    console.log(
        "Melihat detail order:",
        order
    );


    const detailBody =
        document.getElementById(
            "detailModalBody"
        );


    const detailIdRef =
        document.getElementById(
            "detailIdRef"
        );


    if (!detailBody) {

        console.error(
            "detailModalBody tidak ditemukan."
        );

        return;
    }


    if (detailIdRef) {

        detailIdRef.innerText =
            `Reference ID: ${order.id}`;
    }


    detailBody.innerHTML = `

        <div
            class="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between"
        >

            <div>

                <div
                    class="flex items-center gap-2 mb-1"
                >

                    <span
                        class="text-[10px] text-indigo-300 font-bold uppercase"
                    >
                        ${order.id_lop || "-"}
                    </span>

                    <span
                        class="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase"
                    >
                        ${order.segmen || "-"}
                    </span>

                </div>


                <h3 class="text-base font-bold">
                    ${order.customer || "-"}
                </h3>


                <p class="text-xs text-slate-300 mt-0.5">
                    ${order.produk || "-"}
                    (${order.bw || "N/A"})
                </p>

            </div>


            <div class="text-right">

                <span
                    class="text-[10px] text-slate-400 block"
                >
                    Total Nilai Proyek
                </span>


                <span
                    class="text-lg font-bold text-amber-400"
                >
                    ${formatRupiah(
                        order.total_proyek
                    )}
                </span>

            </div>

        </div>


        <div class="grid grid-cols-2 gap-4">

            <div
                class="p-3 bg-slate-50 border border-slate-200 rounded-lg"
            >

                <h4
                    class="font-bold text-slate-700 text-[11px] uppercase mb-2 border-b pb-1"
                >
                    Spesifikasi Segmen & Layanan
                </h4>


                <p>
                    <strong>
                        CC Nipnas:
                    </strong>

                    <span
                        class="font-mono text-slate-800"
                    >
                        ${order.cc_nipnas || "-"}
                    </span>
                </p>


                <p class="mt-1">

                    <strong>
                        Segmen Portfolio:
                    </strong>

                    <span
                        class="text-indigo-700 font-bold"
                    >
                        ${order.segmen || "-"}
                    </span>

                </p>


                <p class="mt-1">

                    <strong>
                        Kategori Order:
                    </strong>

                    ${order.kategori || "-"}

                </p>


                <p class="mt-1">

                    <strong>
                        Bandwidth:
                    </strong>

                    ${order.bw || "-"}

                </p>


                <p class="mt-1">

                    <strong>
                        Durasi Kontrak:
                    </strong>

                    ${order.durasi || 0}
                    Bulan

                </p>


                <p class="mt-1">

                    <strong>
                        SID:
                    </strong>

                    ${order.sid || "-"}

                </p>

            </div>


            <div
                class="p-3 bg-slate-50 border border-slate-200 rounded-lg"
            >

                <h4
                    class="font-bold text-slate-700 text-[11px] uppercase mb-2 border-b pb-1"
                >
                    Dokumen & Referensi
                </h4>


                <p>

                    <strong>
                        No. Quote:
                    </strong>

                    ${order.quote || "-"}

                </p>


                <p class="mt-1">

                    <strong>
                        No. Order / WO:
                    </strong>

                    ${order.order_no || "-"}

                </p>


                <p class="mt-1">

                    <strong>
                        Billing Account:
                    </strong>

                    ${order.billing_account || "-"}

                </p>


                <p class="mt-1">

                    <strong>
                        No. Kontrak:
                    </strong>

                    ${order.no_kontrak || "-"}

                </p>

            </div>


            <div
                class="p-3 bg-slate-50 border border-slate-200 rounded-lg"
            >

                <h4
                    class="font-bold text-slate-700 text-[11px] uppercase mb-2 border-b pb-1"
                >
                    Rincian Finansial
                </h4>


                <p>

                    <strong>
                        Biaya OTC:
                    </strong>

                    ${formatRupiah(
                        order.otc
                    )}

                </p>


                <p class="mt-1">

                    <strong>
                        Biaya Bulanan (MRC):
                    </strong>

                    ${formatRupiah(
                        order.bulanan
                    )}
                    / bln

                </p>


                <p
                    class="mt-1 font-bold text-indigo-700"
                >

                    <strong>
                        Total Proyek:
                    </strong>

                    ${formatRupiah(
                        order.total_proyek
                    )}

                </p>

            </div>


            <div
                class="p-3 bg-slate-50 border border-slate-200 rounded-lg"
            >

                <h4
                    class="font-bold text-slate-700 text-[11px] uppercase mb-2 border-b pb-1"
                >
                    Status Operational & Legal
                </h4>


                <p>

                    <strong>
                        Status Order:
                    </strong>

                    ${order.status || "-"}

                </p>


                <p class="mt-1">

                    <strong>
                        Tgl Provcom:
                    </strong>

                    ${formatDate(
                        order.provcom
                    )}

                </p>


                <p class="mt-1">

                    <strong>
                        Tgl Billcom:
                    </strong>

                    ${formatDate(
                        order.billcom
                    )}

                </p>


                <p class="mt-1">

                    <strong>
                        Review Kontrak:
                    </strong>

                    ${
                        order.review_kontrak
                            ? `
                                <a
                                    href="${order.review_kontrak}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="text-indigo-600 underline"
                                >
                                    Link Kontrak
                                </a>
                            `
                            : "-"
                    }

                </p>


                <p class="mt-1">

                    <strong>
                        Periode:
                    </strong>

                    ${formatDate(
                        order.start_date
                    )}

                    s/d

                    ${formatDate(
                        order.end_date
                    )}

                </p>

            </div>

        </div>


        <div
            class="p-3 bg-slate-50 border border-slate-200 rounded-lg"
        >

            <h4
                class="font-bold text-slate-700 text-[11px] uppercase mb-1 border-b pb-1"
            >
                Keterangan / Catatan Tambahan
            </h4>


            <p
                class="text-slate-700 leading-relaxed"
            >
                ${order.keterangan || "-"}
            </p>

        </div>
    `;


    const detailModal =
        document.getElementById(
            "detailModal"
        );


    const detailModalContent =
        document.getElementById(
            "detailModalContent"
        );


    if (!detailModal) {
        return;
    }


    detailModal.classList.remove(
        "hidden"
    );


    if (detailModalContent) {

        setTimeout(
            () => {

                detailModalContent.classList.remove(
                    "modal-exit-active",
                    "modal-exit",
                    "modal-enter"
                );


                detailModalContent.classList.add(
                    "modal-enter-active"
                );

            },
            10
        );
    }
}


/* =========================================================
   CLOSE DETAIL MODAL
========================================================= */

function closeDetailModal() {

    const detailModal =
        document.getElementById(
            "detailModal"
        );


    const detailModalContent =
        document.getElementById(
            "detailModalContent"
        );


    if (!detailModal) {
        return;
    }


    if (detailModalContent) {

        detailModalContent.classList.remove(
            "modal-enter-active"
        );


        detailModalContent.classList.add(
            "modal-exit-active"
        );
    }


    setTimeout(
        () => {

            detailModal.classList.add(
                "hidden"
            );

        },
        200
    );
}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );


    const toastMessage =
        document.getElementById(
            "toastMessage"
        );


    const toastIcon =
        document.getElementById(
            "toastIcon"
        );


    if (!toast) {

        console.warn(
            "Toast element tidak ditemukan:",
            message
        );

        return;
    }


    if (toastMessage) {

        toastMessage.innerText =
            message;
    }


    if (toastIcon) {

        if (
            type === "success"
        ) {

            toastIcon.className =
                "fas fa-check-circle text-emerald-400 mr-2.5 text-base";

        } else {

            toastIcon.className =
                "fas fa-exclamation-circle text-rose-400 mr-2.5 text-base";
        }
    }


    toast.classList.remove(
        "translate-y-20",
        "opacity-0"
    );


    setTimeout(
        () => {

            toast.classList.add(
                "translate-y-20",
                "opacity-0"
            );

        },
        3000
    );
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

const searchInput =
    document.getElementById(
        "searchInput"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );
}


const filterSegmen =
    document.getElementById(
        "filterSegmen"
    );


if (filterSegmen) {

    filterSegmen.addEventListener(
        "change",
        applyFilters
    );
}


const filterKategori =
    document.getElementById(
        "filterKategori"
    );


if (filterKategori) {

    filterKategori.addEventListener(
        "change",
        applyFilters
    );
}


const filterStatus =
    document.getElementById(
        "filterStatus"
    );


if (filterStatus) {

    filterStatus.addEventListener(
        "change",
        applyFilters
    );
}


/* =========================================================
   ORDER FORM SUBMIT
========================================================= */

const orderForm =
    document.getElementById(
        "orderForm"
    );


if (orderForm) {

    orderForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (currentEditingId) {

                await updateOrder();

                return;
            }


            await addOrder();
        }
    );
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.applyFilters =
    applyFilters;

window.renderTable =
    renderTable;

window.updateStats =
    updateStats;

window.calculateTotalProyek =
    calculateTotalProyek;

window.showToast =
    showToast;

window.openModal =
    openModal;

window.closeModal =
    closeModal;

window.viewDetail =
    viewDetail;

window.closeDetailModal =
    closeDetailModal;

window.updateOrder =
    updateOrder;

window.addOrder =
    addOrder;

window.confirmDelete =
    confirmDelete;

window.deleteOrder =
    deleteOrder;

window.closeDeleteModal =
    closeDeleteModal;

window.exportToExcel =
    exportToExcel;


/* =========================================================
   INITIALIZE
========================================================= */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "===================================="
        );

        console.log(
            "APP INITIALIZED"
        );

        console.log(
            "===================================="
        );


        /*
           Pastikan tombol delete modal
           sudah memiliki event.
        */

        setupDeleteConfirmButton();


        /*
           Load data
        */

        loadOrders();
    }
);