import postgres from "postgres";
import crypto from "node:crypto";
import { seedMerchants } from "./seed-merchants";

function generateRandomTransaction(date: Date) {
	const merchant =
		seedMerchants[Math.floor(Math.random() * seedMerchants.length)];

	// Base amount between $1 and $100
	const baseAmount = Math.floor(Math.random() * 10000) + 100;

	// Add weekly variance (some weeks have 2x-3x more spend)
	const weekMultiplier = Math.random() < 0.2 ? Math.random() * 2 + 1 : 1;

	// Add daily variance (some days have 1.5x-2x more spend)
	const dayMultiplier = Math.random() < 0.3 ? Math.random() * 0.5 + 1.5 : 1;

	const finalAmount = Math.floor(baseAmount * weekMultiplier * dayMultiplier);

	// Generate a random time within the day
	const randomTime = new Date(
		date.getTime() + Math.random() * 24 * 60 * 60 * 1000,
	);

	return {
		id: crypto.randomUUID(),
		amountCents: finalAmount,
		merchantName: merchant.name,
		merchantImage: merchant.image,
		date: randomTime,
		status: "completed",
	};
}

async function seed() {
	const sql = postgres("postgres://postgres@localhost:5432/slash", {
		idle_timeout: 20,
		max_lifetime: 60 * 30,
	});

	try {
		// Drop table "transaction" if it exists
		await sql`DROP TABLE IF EXISTS transaction;`;

		// Create table "transaction"
		await sql`
			CREATE TABLE transaction (
				id UUID PRIMARY KEY,
				"amountCents" INTEGER NOT NULL,
				"merchantName" VARCHAR(255) NOT NULL,
				"merchantImage" TEXT NOT NULL,
				date TIMESTAMP NOT NULL,
				status VARCHAR(50) NOT NULL
			);
		`;

		// Create index on date column for descending order
		await sql`CREATE INDEX idx_transaction_date_desc ON transaction (date DESC) INCLUDE ("amountCents");`;

		// Generate and insert transactions
		const startDate = new Date(2021, 0, 1);
		const endDate = new Date();
		const totalDays = Math.floor(
			(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
		);

		// Calculate average transactions per day to reach approximately 300,000
		const avgTransactionsPerDay = Math.floor(300000 / totalDays);

		let totalTransactions = 0;

		for (let day = 0; day < totalDays; day++) {
			const currentDate = new Date(
				startDate.getTime() + day * 24 * 60 * 60 * 1000,
			);

			// Random number of transactions per day (between 50% and 150% of the average)
			const transactionsPerDay = Math.floor(
				avgTransactionsPerDay * (0.5 + Math.random()),
			);

			const transactions = Array.from({ length: transactionsPerDay }, () =>
				generateRandomTransaction(currentDate),
			);

			await sql`
				INSERT INTO transaction ${sql(
					transactions,
					"id",
					"amountCents",
					"merchantName",
					"merchantImage",
					"date",
					"status",
				)}
			`;
			totalTransactions += transactionsPerDay;
			console.log(
				`Inserted ${transactionsPerDay} transactions for ${currentDate.toDateString()}`,
			);
		}

		console.log(
			`Seed completed successfully. Total transactions: ${totalTransactions}`,
		);
	} catch (error) {
		console.error("Error during seed:", error);
	} finally {
		// Close the database connection
		await sql.end();
	}
}

seed();
