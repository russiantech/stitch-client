import React, { useState } from 'react';
import { SectionHeader, StatusBadge } from '../../components/shared/index.jsx';
import { MOCK_LAUNDRY_ORDERS, MOCK_FASHION_ORDERS, LAUNDRY_STATUSES } from '../../services/mockData.js';
import { useToast } from '../../context/ToastContext.jsx';

const MY_TASKS = [
  { id: 'T-001', order_id: 'LD-001', type: 'Laundry', task: 'Wash & Dry', status: 'In Progress', priority: 'Normal' },
  { id: 'T-002', order_id: 'LD-002', type: 'Laundry', task: 'Ironing', status: 'Pending', priority: 'Express' },
  { id: 'T-003', order_id: 'FS-001', type: 'Fashion', task: 'Cutting & Sewing', status: 'Pending', priority: 'Normal' },
  { id: 'T-004', order_id: 'LD-003', type: 'Laundry', task: 'Dry Cleaning', status: 'Completed', priority: 'Normal' },
];

export default function StaffPortal() {
  const toast = useToast();
  const [tasks, setTasks] = useState(MY_TASKS);

  const updateTask = (id, status) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    toast.success(`Task ${id} updated to ${status}`);
  };

  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const pending = tasks.filter(t => t.status === 'Pending').length;
  const completed = tasks.filter(t => t.status === 'Completed').length;

  return (
    <div>
      <SectionHeader title="Staff Portal" subtitle="Your daily tasks and production queue" />

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <div className="stat-card text-center">
            <div className="stat-value text-warning">{pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="col-4">
          <div className="stat-card text-center">
            <div className="stat-value text-primary">{inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="col-4">
          <div className="stat-card text-center">
            <div className="stat-value text-success">{completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="bg-white rounded-3 border overflow-hidden mb-4">
        <div className="p-3 border-bottom">
          <h6 className="fw-semibold mb-0">Today's Tasks</h6>
        </div>
        <div className="p-3 d-flex flex-column gap-3">
          {tasks.map(task => (
            <div key={task.id} className="border rounded-3 p-3">
              <div className="d-flex align-items-start justify-content-between mb-2">
                <div>
                  <div className="fw-medium small">{task.task}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>{task.type} · {task.order_id}</div>
                </div>
                <div className="d-flex gap-1 align-items-center">
                  {task.priority === 'Express' && <span className="badge bg-danger" style={{ fontSize: 9 }}>Express</span>}
                  <span className={`badge ${task.status === 'Completed' ? 'bg-success' : task.status === 'In Progress' ? 'bg-primary' : 'bg-secondary'}`} style={{ fontSize: 10 }}>
                    {task.status}
                  </span>
                </div>
              </div>
              {task.status !== 'Completed' && (
                <div className="d-flex gap-2 mt-2">
                  {task.status === 'Pending' && (
                    <button className="btn btn-xs btn-outline-primary" style={{ fontSize: 11, padding: '2px 10px' }} onClick={() => updateTask(task.id, 'In Progress')}>
                      <i className="fas fa-play me-1" />Start
                    </button>
                  )}
                  {task.status === 'In Progress' && (
                    <button className="btn btn-xs btn-success" style={{ fontSize: 11, padding: '2px 10px' }} onClick={() => updateTask(task.id, 'Completed')}>
                      <i className="fas fa-check me-1" />Mark Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Laundry Queue Preview */}
      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="p-3 border-bottom">
          <h6 className="fw-semibold mb-0">Laundry Production Queue</h6>
        </div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th className="ps-4 small fw-medium text-muted">Order</th>
                <th className="small fw-medium text-muted">Service</th>
                <th className="small fw-medium text-muted">Items</th>
                <th className="small fw-medium text-muted">Current Stage</th>
                <th className="small fw-medium text-muted pe-4">Priority</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_LAUNDRY_ORDERS.filter(o => !['Completed', 'Delivered'].includes(o.status)).map(o => (
                <tr key={o.id}>
                  <td className="ps-4 fw-medium small">{o.id}</td>
                  <td className="small text-muted">{o.service}</td>
                  <td className="small">{o.items}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="pe-4">
                    <span className={`badge ${o.priority === 'Express' ? 'bg-danger' : 'bg-light text-muted border'}`} style={{ fontSize: 10 }}>
                      {o.priority}
                    </span>
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
