import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [house, setHouse] = useState(null);
  const [bills, setBills] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [houseLoading, setHouseLoading] = useState(true);
  const [billsLoading, setBillsLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [user]); // Re-fetch when user changes

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    // Fetch all data independently
    await Promise.all([
      fetchHouseData(),
      fetchBillsData(),
      fetchWalletData()
    ]);

    setLoading(false);
  };

  const fetchHouseData = async () => {
    try {
      setHouseLoading(true);
      const houseResponse = await api.get('/house/my-house');
      setHouse(houseResponse.data);
    } catch (err) {
      // Don't show error if user hasn't joined a house yet
      if (err.response?.status !== 400) {
        console.error('House data error:', err);
      }
      setHouse(null);
    } finally {
      setHouseLoading(false);
    }
  };

  const fetchBillsData = async () => {
    try {
      setBillsLoading(true);
      const billsResponse = await api.get('/bill/my-bills');
      setBills(billsResponse.data.slice(0, 5)); // Show only recent 5 bills
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

  const fetchWalletData = async () => {
    try {
      setWalletLoading(true);
      const walletResponse = await api.get('/wallet/balance');
      setWalletBalance(walletResponse.data.balance);
    } catch (err) {
      console.error('Wallet data error:', err);
      setWalletBalance(0);
    } finally {
      setWalletLoading(false);
    }
  };

  const getPendingBills = () => {
    return bills.filter(bill => bill.status === 'pending').length;
  };

  const getTotalOwed = () => {
    return bills
      .filter(bill => bill.status === 'pending')
      .reduce((total, bill) => total + bill.amountOwed, 0);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your house management overview.</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-grid">
        {/* House Status Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>My House</h3>
            <i className="icon-house"></i>
          </div>
          <div className="card-content">
            {house ? (
              <>
                <h4>{house.name}</h4>
                <p>Code: {house.joinCode}</p>
                <p>Members: {house.tenants?.length || 0}</p>
                {house.isAdmin && <span className="admin-badge">Admin</span>}
              </>
            ) : (
              <div className="no-house">
                <p>You haven't joined a house yet.</p>
                <a href="/houses" className="btn-primary">Join or Create House</a>
              </div>
            )}
          </div>
        </div>

        {/* Wallet Balance Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Wallet Balance</h3>
            <i className="icon-wallet"></i>
          </div>
          <div className="card-content">
            <div className="balance-amount">₦{walletBalance.toLocaleString()}</div>
            <p>Available funds</p>
            <a href="/wallet" className="btn-secondary">View Details</a>
          </div>
        </div>

        {/* Bills Summary Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Bill Summary</h3>
            <i className="icon-bill"></i>
          </div>
          <div className="card-content">
            <div className="bill-stats">
              <div className="stat">
                <span className="stat-number">{getPendingBills()}</span>
                <span className="stat-label">Pending Bills</span>
              </div>
              <div className="stat">
                <span className="stat-number">₦{getTotalOwed().toLocaleString()}</span>
                <span className="stat-label">Amount Owed</span>
              </div>
            </div>
            <a href="/bills" className="btn-secondary">View All Bills</a>
          </div>
        </div>

        {/* Recent Bills Card */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3>Recent Bills</h3>
            <i className="icon-recent"></i>
          </div>
          <div className="card-content">
            {bills.length > 0 ? (
              <div className="recent-bills">
                {bills.map(bill => (
                  <div key={bill._id} className="bill-item">
                    <div className="bill-info">
                      <h4>{bill.title}</h4>
                      <p>{bill.description}</p>
                      <small>Due: {new Date(bill.dueDate).toLocaleDateString()}</small>
                    </div>
                    <div className="bill-amount">
                      <span className={`amount ${bill.status === 'paid' ? 'paid' : 'pending'}`}>
                        ₦{bill.amountOwed.toLocaleString()}
                      </span>
                      <span className={`status ${bill.status}`}>
                        {bill.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No bills yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
