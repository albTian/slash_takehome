import { type NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres("postgres://postgres@localhost:5432/slash", {
	idle_timeout: 20,
	max_lifetime: 60 * 30,
});

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const cursor = searchParams.get("cursor");
	const limit = 500;

	try {
		const transactions = await (() => {
			if (cursor) {
				return sql`
				SELECT * FROM transaction
				WHERE date < ${new Date(cursor)}
				ORDER BY date DESC
				LIMIT ${limit}
        `;
			}

			return sql`
      SELECT * FROM transaction
      ORDER BY date DESC
      LIMIT ${limit}
			`;
		})();

		const nextCursor =
			transactions.length === limit
				? transactions[transactions.length - 1].date.toISOString()
				: null;

		return NextResponse.json({
			transactions,
			nextCursor,
		});
	} catch (error) {
		console.error("Error fetching transactions:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
