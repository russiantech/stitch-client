import React, { useState } from 'react';
import { SectionHeader } from '../../components/shared/index.jsx';
import { MOCK_INVOICES, formatNGN } from '../../services/mockData.js';

function StatusBadge({ status }) {
  const map = { Paid: 'bg-success', Partial: 'bg-warning text-dark', Unpaid: 'bg-danger' };
  return <span className={`badge ${map[status] || 'bg-secondary'}`} style={{ fontSize: 10 }}>{status}</span>;
}

export default function Payments() {
  const [invoices] = useState(MOCK_INVOICES);

  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  const totalDue = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (i.amount - (i.paid || 0)), 0);

  return (
    <div>
      <SectionHeader title="Payments & Invoices" subtitle="Your payment history and outstanding balances" />

      <div className="row g-3 mb-4">
        <div className="col-6 col-sm-3">
          <div className="stat-card">
            <div className="stat-label text-success">Total Paid</div>
            <div className="stat-value text-success">{formatNGN(totalPaid)}</div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="stat-card">
            <div className="stat-label text-warning">Outstanding</div>
            <div className="stat-value text-warning">{formatNGN(totalDue)}</div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="stat-card">
            <div className="stat-label">Invoices</div>
            <div className="stat-value">{invoices.length}</div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="stat-card">
            <div className="stat-label text-primary">Loyalty Points</div>
            <div className="stat-value text-primary">340</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th className="ps-4 small fw-medium text-muted">Invoice</th>
                <th className="small fw-medium text-muted">Order</th>
                <th className="small fw-medium text-muted">Date</th>
                <th className="small fw-medium text-muted">Status</th>
                <th className="small fw-medium text-muted text-end pe-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="ps-4 fw-medium small">{inv.id}</td>
                  <td className="small text-muted">{inv.order_id}</td>
                  <td className="small text-muted">{inv.date}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td className="text-end pe-4 fw-medium small">
                    {formatNGN(inv.amount)}
                    {inv.paid > 0 && inv.status !== 'Paid' && (
                      <div className="text-muted" style={{ fontSize: 10 }}>Paid: {formatNGN(inv.paid)}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
