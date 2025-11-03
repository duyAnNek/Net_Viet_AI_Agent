// client/src/pages/Employees.jsx
import { useEffect, useState } from 'react';
import { dataService } from '../services/data.service';

export default function Employees() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    dataService.getEmployees().then(d => setEmployees(d.data || []));
  }, []);

  return (
    <div className="row">
      <div className="col-lg-10 mx-auto">
        <div className="card p-3">
          <h4 className="section-title mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-people-fill text-primary"></i> Employees
          </h4>
          <div className="section-underline mb-3"></div>

          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th><i className="bi bi-hash"></i> ID</th>
                  <th><i className="bi bi-person"></i> Name</th>
                  <th><i className="bi bi-badge-ad"></i> Role</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td>{e.name}</td>
                    <td><span className="badge text-bg-light border">{e.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}