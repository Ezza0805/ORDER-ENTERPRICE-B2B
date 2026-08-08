import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
);

async function testDatabase() {
    console.log("Supabase URL:");
    console.log(process.env.SUPABASE_URL);

    console.log("\nMengambil data orders...\n");

    const { data, error, count } = await supabase
        .from("orders")
        .select("*", { count: "exact" });

    if (error) {
        console.error("❌ SUPABASE ERROR");
        console.error("Message :", error.message);
        console.error("Details :", error.details);
        console.error("Hint    :", error.hint);
        console.error("Code    :", error.code);
        return;
    }

    console.log("✅ Query berhasil");
    console.log("Jumlah data:", count);
    console.log("\nData:");

    console.dir(data, {
        depth: null
    });
}

testDatabase();