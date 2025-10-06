const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let employees = [
  { name: "Alice", id: "E101" },
  { name: "Bob", id: "E102" },
  { name: "Charlie", id: "E103" },
];

const ask = (q) => new Promise((res) => rl.question(q, (a) => res(a.trim())));

function showMenu() {
  console.log("\nEmployee Management System");
  console.log("1. Add Employee");
  console.log("2. List Employees");
  console.log("3. Remove Employee");
  console.log("4. Exit");
}

function listEmployees() {
  if (employees.length === 0) return console.log("\nEmployee List is empty.");
  console.log("\nEmployee List:");
  employees.forEach((e, i) =>
    console.log(`${i + 1}. Name: ${e.name}, ID: ${e.id}`)
  );
}

async function addEmployee() {
  const name = await ask("Enter employee name: ");
  if (!name) return console.log("Name cannot be empty.");
  const id = (await ask("Enter employee ID: ")).toUpperCase();
  if (!id) return console.log("ID cannot be empty.");
  if (employees.some((e) => e.id.toUpperCase() === id))
    return console.log(`Employee with ID ${id} already exists.`);
  employees.push({ name, id });
  console.log(`Employee ${name} (ID: ${id}) added successfully.`);
}

async function removeEmployee() {
  const id = (await ask("Enter employee ID to remove: ")).toUpperCase();
  const idx = employees.findIndex((e) => e.id.toUpperCase() === id);
  if (idx === -1) return console.log(`No employee found with ID ${id}.`);
  const removed = employees.splice(idx, 1)[0];
  console.log(
    `Employee ${removed.name} (ID: ${removed.id}) removed successfully.`
  );
}

async function main() {
  while (true) {
    showMenu();
    const choice = await ask("\nEnter your choice: ");
    if (choice === "1") await addEmployee();
    else if (choice === "2") listEmployees();
    else if (choice === "3") await removeEmployee();
    else if (choice === "4") {
      console.log("Exiting... Bye!");
      rl.close();
      break;
    } else console.log("Invalid choice. Enter 1/2/3/4.");
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  rl.close();
});
