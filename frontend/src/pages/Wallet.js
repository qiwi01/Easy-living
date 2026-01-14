import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Wallet.css';

const Wallet = () => {
  const { user } = useContext(AuthContext);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTopupForm, setShowTopupForm] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);

      // Fetch balance
      const balanceResponse = await api.get('/wallet/balance');
      setBalance(balanceResponse.data.balance);

      // Fetch transactions (if available)
      // For now, we'll show a placeholder since we may not have this endpoint yet

    } catch (err) {
      setError('Failed to load wallet data');
      console.error('Wallet error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // In a real implementation, this would redirect to Paystack payment
      // For now, we'll simulate a direct topup
      const response = await api.post('/wallet/topup', {
        amount: parseFloat(topupAmount),
        // In production, this would include Paystack reference from payment
      });

      setBalance(response.data.balance);
      setShowTopupForm(false);
      setTopupAmount('');
      // Refresh transactions if available
      await fetchWalletData();

    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to topup wallet');
    }
  };

  if (loading) {
    return (
      <div className="wallet">
        <div className="loading">Loading wallet...</div>
      </div>
    );
  }

  return (
    <div className="wallet">
      <div className="page-header">
        <h1>My Wallet</h1>
        <p>Manage your house payment funds</p>
        <button
          className="btn-primary"
          onClick={() => setShowTopupForm(true)}
        >
          Top Up Wallet
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Wallet Balance Card */}
      <div className="wallet-balance-card">
        <div className="balance-header">
          <h2>Current Balance</h2>
          <i className="icon-wallet-large"></i>
        </div>
        <div className="balance-amount">
          ₦{balance.toLocaleString()}
        </div>
        <p className="balance-description">
          Available funds for house bill payments
        </p>
      </div>

      {/* Topup Modal */}
      {showTopupForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Top Up Wallet</h3>
              <button
                className="close-btn"
                onClick={() => setShowTopupForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleTopup} className="modal-form">
              <div className="form-group">
                <label htmlFor="topupAmount">Amount to Add (₦)</label>
                <input
                  type="number"
                  id="topupAmount"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  required
                  min="100"
                  step="50"
                  placeholder="Enter amount (minimum ₦100)"
                />
                <small>Minimum topup amount is ₦100</small>
              </div>

              <div className="payment-notice">
                <p><strong>Note:</strong> This will redirect you to Paystack for secure payment processing.</p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowTopupForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={!topupAmount || parseFloat(topupAmount) < 100}>
                  Proceed to Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="transactions-section">
        <h2>Transaction History</h2>

        <div className="transactions-container">
          {transactions.length > 0 ? (
            transactions.map(transaction => (
              <div key={transaction._id} className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-type">
                    <span className={`type-badge ${transaction.type}`}>
                      {transaction.type}
                    </span>
                    <h4>{transaction.description}</h4>
                  </div>
                  <div className="transaction-details">
                    <small>{new Date(transaction.createdAt).toLocaleDateString()}</small>
                    {transaction.paystackRef && (
                      <small>Ref: {transaction.paystackRef}</small>
                    )}
                  </div>
                </div>
                <div className="transaction-amount">
                  <span className={`amount ${transaction.type === 'topup' ? 'positive' : 'negative'}`}>
                    {transaction.type === 'topup' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-transactions">
              <h3>No transactions yet</h3>
              <p>Your wallet transaction history will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Info */}
      <div className="wallet-info">
        <h3>How Wallet Works</h3>
        <div className="info-grid">
          <div className="info-item">
            <i className="icon-info"></i>
            <h4>Top Up</h4>
            <p>Add funds to your wallet using Paystack secure payment.</p>
          </div>
          <div className="info-item">
            <i className="icon-info"></i>
            <h4>Pay Bills</h4>
            <p>Use wallet funds to pay your share of house bills instantly.</p>
          </div>
          <div className="info-item">
            <i className="icon-info"></i>
            <h4>Track Payments</h4>
            <p>See who has paid and who hasn't in your house group.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
