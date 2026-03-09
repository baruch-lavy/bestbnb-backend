import bcrypt from "bcrypt";
import { dbService } from "./services/db.service.js";

async function updatePasswords() {
  const collection = await dbService.getCollection("user");

  const users = await collection.find({}).toArray();

  for (let user of users) {
    if (!user.password || user.password.length < 20) {
      //  Only hash plain text passwords
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await collection.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } },
      );
      console.log(` Updated password for user: ${user.username}`);
    }
  }

  console.log("🔄 Password update complete!");
}

updatePasswords().then(() => process.exit());
