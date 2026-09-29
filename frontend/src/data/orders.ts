import type { Order } from "@/types/order";

/** Temporary frontend data until an orders API is connected. */
export const orders: Order[] = [
  {
    no: "ORD-2025-0842",
    customer: "PT Nusantara Retail",
    product: "Display Rack Series A",
    process: "Design Review",
    pic: "Andi Pratama",
    deadline: "24 Jun 2025",
    status: "In Review",
    tone: "info",
  },
  {
    no: "ORD-2025-0839",
    customer: "CV Prima Sentosa",
    product: "Counter Display Unit",
    process: "Quality Control",
    pic: "Maya Lestari",
    deadline: "22 Jun 2025",
    status: "Overdue",
    tone: "danger",
  },
  {
    no: "ORD-2025-0836",
    customer: "PT Sinar Abadi",
    product: "Floor Stand Custom",
    process: "Sample",
    pic: "Rizky Saputra",
    deadline: "27 Jun 2025",
    status: "In Progress",
    tone: "info",
  },
  {
    no: "ORD-2025-0831",
    customer: "PT Global Niaga",
    product: "Wall Display Modular",
    process: "Approval",
    pic: "Sarah Wijaya",
    deadline: "29 Jun 2025",
    status: "Waiting",
    tone: "warning",
  },
  {
    no: "ORD-2025-0828",
    customer: "CV Mitra Bersama",
    product: "Product Gondola",
    process: "Completed",
    pic: "Dimas Nugroho",
    deadline: "18 Jun 2025",
    status: "Completed",
    tone: "success",
  },
];

export default orders;
