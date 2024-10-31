import { type NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres("postgres://postgres@localhost:5432/slash", {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  let selectedMerchant = searchParams.get("merchant") || null;
  if (selectedMerchant === "all") {
    selectedMerchant = null;
  }

  console.log("selectedMerchant", selectedMerchant);
  const limit = 50;
  const offset = (page - 1) * limit;

  try {
    const [transactions, totalCount, allMerchants] = await Promise.all([
      sql`
        SELECT * FROM transaction
        WHERE (${fromDate}::timestamp IS NULL OR date >= ${fromDate}::timestamp)
        AND (${toDate}::timestamp IS NULL OR date <= ${toDate}::timestamp)
        AND (${selectedMerchant}::text IS NULL OR "merchantName" = ${selectedMerchant}::text)
        ORDER BY date DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) FROM transaction
        WHERE (${fromDate}::timestamp IS NULL OR date >= ${fromDate}::timestamp)
        AND (${toDate}::timestamp IS NULL OR date <= ${toDate}::timestamp)
        AND (${selectedMerchant}::text IS NULL OR "merchantName" = ${selectedMerchant}::text)
      `,
      sql`
        SELECT DISTINCT "merchantName"
        FROM transaction
        WHERE (${fromDate}::timestamp IS NULL OR date >= ${fromDate}::timestamp)
        AND (${toDate}::timestamp IS NULL OR date <= ${toDate}::timestamp)
        ORDER BY "merchantName"
      `,
    ]);

    const totalPages = Math.ceil(totalCount[0].count / limit);
    const hasNextPage = page < totalPages;

    return NextResponse.json({
      transactions,
      allMerchants: allMerchants.map((m) => m.merchantName),
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage,
        totalCount: totalCount[0].count,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
