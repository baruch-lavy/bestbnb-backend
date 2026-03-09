import bcrypt from "bcrypt";

const enteredPassword = "Edgar"; // 🔑 The password the user enters
const storedHash =
  "$2b$10$GaG5Q/Simr0uIaButcSZHOZT1wo.6q1xXaeVnsu2NY4lFxSXiQOwu"; // 🔒 Edgar's stored hashed password

bcrypt
  .compare(enteredPassword, storedHash)
  .then((result) => {
    console.log(" Password match:", result); // true if passwords match
  })
  .catch((err) => {
    console.error(" Error:", err);
  });
