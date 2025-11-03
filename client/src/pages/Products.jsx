// client/src/pages/Products.jsx
import { useEffect, useState } from 'react';
import { dataService } from '../services/data.service';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    dataService.getProducts().then(d => setProducts(d.data || []));
    dataService.getInventoryValue().then(d => setTotalValue(d.total || 0));
  }, []);

  return (
    <div className="row">
      <div className="col-lg-10 mx-auto">
        <div className="card p-3">
          <h4 className="section-title mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-box-seam text-primary"></i> Products
          </h4>
          <div className="section-underline mb-3"></div>

          <div className="mb-2">
            <span className="me-2 fw-semibold">Tổng giá trị tồn kho:</span>
            <span className="badge" style={{background:'linear-gradient(90deg,#60a5fa,#93c5fd)', color:'#fff'}}>{totalValue}</span>
          </div>

          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th><i className="bi bi-hash"></i> ID</th>
                  <th><i className="bi bi-box"></i> Name</th>
                  <th><i className="bi bi-currency-dollar"></i> Price</th>
                  <th><i className="bi bi-123"></i> Quantity</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.price}</td>
                    <td>{p.quantity}</td>
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