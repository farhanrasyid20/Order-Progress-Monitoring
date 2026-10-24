"use client";

import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import type { Order } from "@/types/order";

export type IncomingOrdersTableProps = {
  orders: Order[];
  onShowDetails: (order: Order) => void;
};

export function IncomingOrdersTable({ orders, onShowDetails }: IncomingOrdersTableProps) {
  return <div className="table-wrap">
    <table className="incoming-orders-table">
      <thead><tr>
        <th>Action</th><th>Status</th><th>PSR / Code</th><th>Current Process</th>
        <th>Customer &amp; Product</th><th>Designer</th><th>Deadline</th>
      </tr></thead>
      <tbody>{orders.map((order) => <tr key={order.id}>
        <td><button type="button" className="table-detail-button" onClick={() => onShowDetails(order)} aria-label={`Details for ${order.no}`}><Icon name="eye" size={14} />Details</button></td>
        <td><Badge tone={order.tone}>{order.status}</Badge></td>
        <td><strong className="order-number">{order.no}</strong></td>
        <td>{order.process}</td>
        <td><strong>{order.customer}</strong><span>{order.product}</span></td>
        <td>{order.pic}</td><td>{order.deadline}</td>
      </tr>)}</tbody>
    </table>
    {orders.length === 0 ? <div className="empty-state"><div><Icon name="search" /></div><h3>No projects found</h3><p>Try adjusting the search or filters.</p></div> : null}
  </div>;
}

export default IncomingOrdersTable;
