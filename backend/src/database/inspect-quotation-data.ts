import { db } from "./connection.js";

console.log("EXISTING QUOTATIONS:");
console.log(
  db.prepare("SELECT * FROM quotations").all()
);

console.log("EXISTING QUOTATION ITEMS:");
console.log(
  db.prepare("SELECT * FROM quotation_items").all()
);

console.log("EXISTING ENQUIRIES:");
console.log(
  db.prepare(`
    SELECT id, enquiry_number, customer_id, status
    FROM enquiries
  `).all()
);

console.log("ACTIVE MACHINE MODELS:");
console.log(
  db.prepare(`
    SELECT id, name, model_number, base_price_paisa, is_active
    FROM machine_models
    WHERE is_active = 1
  `).all()
);

db.close();