import "dotenv/config";

import { PGlite } from "@electric-sql/pglite";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const INTROSPECT_SQL = `
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position
`;

type ProblemSpec = {
  title: string;
  prompt: string;
  solutionQuery: string;
  orderMatters: boolean;
  difficulty: "EASY" | "MEDIUM" | "HARD";
};

type DatasetSpec = {
  title: string;
  description: string;
  seedSql: string;
  problems: ProblemSpec[];
};

async function runSql(seedSql: string, query: string) {
  const db = new PGlite();
  try {
    await db.exec(seedSql);
    const res = await db.query<Record<string, unknown>>(query);
    return {
      columns: res.fields.map((field) => field.name),
      rows: res.rows,
      rowCount: res.rows.length,
      truncated: false,
    };
  } finally {
    await db.close();
  }
}

async function introspect(seedSql: string) {
  const res = await runSql(seedSql, INTROSPECT_SQL);
  const byTable = new Map<string, { name: string; type: string }[]>();
  for (const row of res.rows) {
    const table = String(row.table_name);
    const columns = byTable.get(table) ?? [];
    columns.push({
      name: String(row.column_name),
      type: String(row.data_type),
    });
    byTable.set(table, columns);
  }
  return Array.from(byTable.entries()).map(([name, columns]) => ({
    name,
    columns,
  }));
}

const toJson = (value: unknown) => JSON.parse(JSON.stringify(value));

const DATASETS: DatasetSpec[] = [
  {
    title: "Online store",
    description: "Customers and the orders they have placed.",
    seedSql: `CREATE TABLE customers (
  id serial PRIMARY KEY,
  name text NOT NULL,
  city text,
  joined_at date NOT NULL
);

CREATE TABLE orders (
  id serial PRIMARY KEY,
  customer_id int NOT NULL REFERENCES customers(id),
  product text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  ordered_at date NOT NULL
);

INSERT INTO customers (name, city, joined_at) VALUES
  ('Ada Lovelace', 'London', '2025-01-12'),
  ('Grace Hopper', 'New York', '2025-02-03'),
  ('Linus Torvalds', 'Helsinki', '2025-02-20'),
  ('Margaret Hamilton', 'Boston', '2025-03-15'),
  ('Alan Turing', 'London', '2025-04-01');

INSERT INTO orders (customer_id, product, amount, ordered_at) VALUES
  (1, 'Keyboard', 49.99, '2025-05-02'),
  (1, 'Monitor', 199.00, '2025-05-09'),
  (2, 'Mouse', 19.99, '2025-05-11'),
  (2, 'Monitor', 199.00, '2025-06-01'),
  (2, 'Webcam', 79.50, '2025-06-03'),
  (3, 'Keyboard', 49.99, '2025-06-10'),
  (4, 'Standing Desk', 349.00, '2025-06-15'),
  (4, 'Monitor', 199.00, '2025-06-15'),
  (4, 'Cable', 9.99, '2025-06-16'),
  (5, 'Mouse', 19.99, '2025-06-20');`,
    problems: [
      {
        title: "Customers in London",
        prompt: "List the **names** of all customers based in London.",
        solutionQuery: "SELECT name FROM customers WHERE city = 'London'",
        orderMatters: false,
        difficulty: "EASY",
      },
      {
        title: "Big-ticket orders",
        prompt:
          "Find every order over `$100`. Return the `product` and `amount`.",
        solutionQuery: "SELECT product, amount FROM orders WHERE amount > 100",
        orderMatters: false,
        difficulty: "EASY",
      },
      {
        title: "Top 3 spenders",
        prompt:
          "Return the **top 3 customers by total amount spent**, highest first. Show the customer name and their total spend.",
        solutionQuery:
          "SELECT c.name, SUM(o.amount) AS total_spend FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.name ORDER BY total_spend DESC LIMIT 3",
        orderMatters: true,
        difficulty: "MEDIUM",
      },
      {
        title: "Popular products",
        prompt:
          "Find the products that have been ordered **more than once**. Return the `product` and how many times it was ordered.",
        solutionQuery:
          "SELECT product, COUNT(*) AS times_ordered FROM orders GROUP BY product HAVING COUNT(*) > 1",
        orderMatters: false,
        difficulty: "HARD",
      },
    ],
  },
  {
    title: "Movies",
    description: "A small collection of films and their ratings.",
    seedSql: `CREATE TABLE films (
  id serial PRIMARY KEY,
  title text NOT NULL,
  director text NOT NULL,
  year int NOT NULL,
  rating numeric(2, 1) NOT NULL
);

INSERT INTO films (title, director, year, rating) VALUES
  ('Inception', 'Christopher Nolan', 2010, 8.8),
  ('Parasite', 'Bong Joon-ho', 2019, 8.5),
  ('Interstellar', 'Christopher Nolan', 2014, 8.6),
  ('The Matrix', 'The Wachowskis', 1999, 8.7),
  ('Whiplash', 'Damien Chazelle', 2014, 8.5);`,
    problems: [
      {
        title: "Recent films",
        prompt: "Return the `title` and `year` of every film released after 2010.",
        solutionQuery: "SELECT title, year FROM films WHERE year > 2010",
        orderMatters: false,
        difficulty: "EASY",
      },
      {
        title: "Films by Nolan",
        prompt: "List the titles of every film directed by Christopher Nolan.",
        solutionQuery:
          "SELECT title FROM films WHERE director = 'Christopher Nolan'",
        orderMatters: false,
        difficulty: "EASY",
      },
      {
        title: "Highest rated film",
        prompt:
          "Return the `title` and `rating` of the single highest rated film.",
        solutionQuery: "SELECT title, rating FROM films ORDER BY rating DESC LIMIT 1",
        orderMatters: true,
        difficulty: "MEDIUM",
      },
    ],
  },
];

async function main() {
  for (const spec of DATASETS) {
    const existing = await prisma.dataset.findFirst({
      where: { title: spec.title, authorId: null },
    });
    if (existing) {
      console.log(`Skipping "${spec.title}" (already seeded).`);
      continue;
    }

    const schema = await introspect(spec.seedSql);
    const dataset = await prisma.dataset.create({
      data: {
        title: spec.title,
        description: spec.description,
        seedSql: spec.seedSql,
        schemaInfo: schema,
        authorId: null,
      },
    });

    for (const problem of spec.problems) {
      const result = await runSql(spec.seedSql, problem.solutionQuery);
      await prisma.problem.create({
        data: {
          title: problem.title,
          prompt: problem.prompt,
          solutionQuery: problem.solutionQuery,
          orderMatters: problem.orderMatters,
          difficulty: problem.difficulty,
          expectedResult: toJson(result),
          datasetId: dataset.id,
          authorId: null,
        },
      });
    }

    console.log(
      `Seeded "${spec.title}" with ${spec.problems.length} problems.`,
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
