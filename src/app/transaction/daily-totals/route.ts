import { type NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres("postgres://postgres@localhost:5432/slash", {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

export async function GET(request: NextRequest) {
  console.log("Fetching daily totals");
  const searchParams = request.nextUrl.searchParams;
  const month = parseInt(searchParams.get("month") || "");
  const year = parseInt(searchParams.get("year") || "");

  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "Invalid month or year parameters" },
      { status: 400 }
    );
  }

  try {
    const dailyTotals = await sql`
      SELECT
        DATE(date) as day,
        SUM("amountCents") as total_amount,
        COUNT(*) as transaction_count
      FROM transaction
      WHERE
        EXTRACT(MONTH FROM date) = ${month}
        AND EXTRACT(YEAR FROM date) = ${year}
      GROUP BY DATE(date)
      ORDER BY day ASC
    `;

    const totalsMap = Object.fromEntries(
      dailyTotals.map((day) => [
        day.day.toISOString().split("T")[0],
        {
          // total amount in cents
          totalAmount: Number(day.total_amount),
          transactionCount: Number(day.transaction_count),
        },
      ])
    );

    return NextResponse.json({ dailyTotals: totalsMap });
  } catch (error) {
    console.error("Error fetching daily totals:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
