import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Bills.css';

const Bills = () => {
  const { user } = useContext(AuthContext);
  const [bills, setBills] = useState([]);
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billsLoading, setBillsLoading] = useState(true);
  const [houseLoading, setHouseLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create bill form
  const [billForm, setBillForm] = useState({
    title: '',
    description: '',
    totalAmount: '',
    dueDate: '',
  });

  useEffect(() => {
    console.log('Bills useEffect triggered');
    fetchBillsData();
  }, []); // Run on mount - page reload will trigger this

  const fetchBillsData = async () => {
    setLoading(true);
    setError('');

    // Fetch bills and house data independently
    await Promise.all([
      fetchBills(),
      fetchHouseInfo()
    ]);

    setLoading(false);
  };

  const fetchBills = async () => {
    try {
      setBillsLoading(true);
      const billsResponse = await api.get('/bill/my-bills');
      setBills(billsResponse.data);
    } catch (err) {
      // Don't show error if user hasn't joined a house yet
      if (err.response?.status !== 400) {
        console.error('Bills data error:', err);
      }
      setBills([]);
    } finally {
      setBillsLoading(false);
    }
  };

  const fetchHouseInfo = async () => {
    try {
      setHouseLoading(true);
      const houseResponse = await api.get('/house/my-house');
      setHouse(houseResponse.data);
    } catch (err) {
      // Don't show error if user hasn't joined a house yet
      if (err.response?.status !== 400) {
        console.error('House info error:', err);
      }
      setHouse(null);
    } finally {
      setHouseLoading(false);
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/bill/create', {
        ...billForm,
        totalAmount: parseFloat(billForm.totalAmount),
        dueDate: new Date(billForm.dueDate).toISOString(),
      });

      setBills(prevBills => [response.data, ...prevBills]);
      setShowCreateForm(false);
      setBillForm({
        title: '',
        description: '',
        totalAmount: '',
        dueDate: '',
      });
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create bill');
    }
  };

  const handlePayBill = async (billId) => {
    try {
      await api.post(`/bill/${billId}/pay`);
      // Refresh bills data
      await fetchBillsData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to pay bill');
    }
  };

  const getTotalPaid = (bill) => {
    return bill.payments?.reduce((total, payment) => total + payment.amount, 0) || 0;
  };

  const getUserPayment = (bill) => {
    return bill.payments?.find(payment => payment.user === user?.id)?.amount || 0;
  };

  if (loading) {
    return (
      <div className="bills">
        <div className="loading">Loading bills...</div>
      </div>
    );
  }

  return (
    <div className="bills">
      <div className="page-header">
        <h1>Bills</h1>
        <p>View and manage house bills</p>
        {house?.isAdmin && (
          <button
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create New Bill
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Create Bill Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Bill</h3>
              <button
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateBill} className="modal-form">
              <div className="form-group">
                <label htmlFor="title">Bill Title</label>
                <input
                  type="text"
                  id="title"
                  value={billForm.title}
                  onChange={(e) => setBillForm({...billForm, title: e.target.value})}
                  required
                  placeholder="e.g., Electricity Bill - March"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={billForm.description}
                  onChange={(e) => setBillForm({...billForm, description: e.target.value})}
                  placeholder="Additional details about the bill"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="totalAmount">Total Amount (₦)</label>
                <input
                  type="number"
                  id="totalAmount"
                  value={billForm.totalAmount}
                  onChange={(e) => setBillForm({...billForm, totalAmount: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Due Date</label>
                <input
                  type="date"
                  id="dueDate"
                  value={billForm.dueDate}
                  onChange={(e) => setBillForm({...billForm, dueDate: e.target.value})}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bills List */}
      <div className="bills-container">
        {bills.length > 0 ? (
          bills.map(bill => {
            const totalPaid = getTotalPaid(bill);
            const userPayment = getUserPayment(bill);
            const remainingAmount = bill.totalAmount - totalPaid;
            const isPaid = userPayment >= bill.amountOwed;

            return (
              <div key={bill._id} className="bill-card">
                <div className="bill-header">
                  <h3>{bill.title}</h3>
                  <span className={`bill-status ${bill.status}`}>
                    {bill.status}
                  </span>
                </div>

                <div className="bill-content">
                  <p className="bill-description">{bill.description}</p>

                  <div className="bill-details">
                    <div className="detail-row">
                      <span>Total Amount:</span>
                      <span className="amount">₦{bill.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span>Your Share:</span>
                      <span className="amount">₦{bill.amountOwed.toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span>You Paid:</span>
                      <span className={`amount ${userPayment > 0 ? 'paid' : ''}`}>
                        ₦{userPayment.toLocaleString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Due Date:</span>
                      <span>{new Date(bill.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-row">
                      <span>Remaining to Pay:</span>
                      <span className="amount">₦{Math.max(0, bill.amountOwed - userPayment).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment Section */}
                  {!isPaid && (
                    <div className="payment-section">
                      <button
                        className="btn-primary"
                        onClick={() => handlePayBill(bill._id)}
                      >
                        Pay Your Share (₦{(bill.amountOwed - userPayment).toLocaleString()})
                      </button>
                    </div>
                  )}

                  {isPaid && (
                    <div className="paid-indicator">
                      ✅ You have paid your share
                    </div>
                  )}
                </div>

                {/* Payments List */}
                {bill.payments && bill.payments.length > 0 && (
                  <div className="payments-section">
                    <h4>Payments Made:</h4>
                    <div className="payments-list">
                      {bill.payments.map((payment, index) => (
                        <div key={index} className="payment-item">
                          <span>{payment.userEmail}</span>
                          <span className="amount">₦{payment.amount.toLocaleString()}</span>
                          <small>{new Date(payment.date).toLocaleDateString()}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="no-bills">
            <h3>No bills yet</h3>
            <p>When your house admin creates bills, they will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bills;
