import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Wallet.css';

const Wallet = () => {
  const { user } = useContext(AuthContext);
  const [balance, setBalance] = useState(0);
  const [houseBalance, setHouseBalance] = useState(0);
  const [house, setHouse] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTopupForm, setShowTopupForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    accountName: '',
    accountNumber: '',
    bankName: ''
  });

  useEffect(() => {
    fetchWalletData();
  }, [user]); // Re-fetch when user changes

  const fetchWalletData = async () => {
    try {
      setLoading(true);

      // Fetch personal balance
      const balanceResponse = await api.get('/wallet/balance');
      setBalance(balanceResponse.data.balance);

      // Try to fetch house wallet balance (only works if user is in a house)
      try {
        const houseResponse = await api.get('/wallet/house-balance');
        setHouseBalance(houseResponse.data.balance);

        // Also fetch house info for admin checks
        const houseInfoResponse = await api.get('/house/my-house');
        setHouse(houseInfoResponse.data);
      } catch (houseErr) {
        // User not in a house, that's fine
        setHouseBalance(0);
        setHouse(null);
      }

      // Fetch transactions (if available)
      // For now, we'll show a placeholder since we may not have this endpoint yet

    } catch (err) {
      setError('Failed to load wallet data');
      console.error('Wallet error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/wallet/house-withdraw', {
        amount: parseFloat(withdrawForm.amount),
        bankDetails: {
          accountName: withdrawForm.accountName,
          accountNumber: withdrawForm.accountNumber,
          bankName: withdrawForm.bankName
        }
      });

      setHouseBalance(response.data.balance);
      setShowWithdrawForm(false);
      setWithdrawForm({
        amount: '',
        accountName: '',
        accountNumber: '',
        bankName: ''
      });

      // Refresh data
      await fetchWalletData();

    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to withdraw funds');
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
        <div className="wallet-actions">
          <button
            className="btn-primary"
            onClick={() => setShowTopupForm(true)}
          >
            💳 Top Up Personal Wallet
          </button>
          {house?.isAdmin && (
            <button
              className="btn-secondary"
              onClick={() => setShowWithdrawForm(true)}
            >
              🏦 Withdraw House Funds
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Personal Wallet Balance Card */}
      <div className="wallet-balance-card">
        <div className="balance-header">
          <h2>Personal Wallet Balance</h2>
          <i className="icon-wallet-large"></i>
        </div>
        <div className="balance-amount">
          ₦{balance.toLocaleString()}
        </div>
        <p className="balance-description">
          Your personal funds for house bill payments
        </p>
      </div>

      {/* House Wallet Balance Card (only if user is in a house) */}
      {house && (
        <div className="wallet-balance-card house-wallet">
          <div className="balance-header">
            <h2>House Wallet Balance</h2>
            <i className="icon-house"></i>
          </div>
          <div className="balance-amount">
            ₦{houseBalance.toLocaleString()}
          </div>
          <p className="balance-description">
            Collective house funds from bill payments
            {house.isAdmin && ' • Admin access to withdraw'}
          </p>
        </div>
      )}

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

      {/* Withdrawal Modal */}
      {showWithdrawForm && house?.isAdmin && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Withdraw House Funds</h3>
              <button
                className="close-btn"
                onClick={() => setShowWithdrawForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleWithdraw} className="modal-form">
              <div className="form-group">
                <label htmlFor="withdrawAmount">Amount to Withdraw (₦)</label>
                <input
                  type="number"
                  id="withdrawAmount"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                  required
                  min="100"
                  max={houseBalance}
                  step="50"
                  placeholder="Enter amount to withdraw"
                />
                <small>Available balance: ₦{houseBalance.toLocaleString()}</small>
              </div>

              <div className="form-group">
                <label htmlFor="accountName">Account Name</label>
                <input
                  type="text"
                  id="accountName"
                  value={withdrawForm.accountName}
                  onChange={(e) => setWithdrawForm({...withdrawForm, accountName: e.target.value})}
                  required
                  placeholder="Enter account name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="accountNumber">Account Number</label>
                <input
                  type="text"
                  id="accountNumber"
                  value={withdrawForm.accountNumber}
                  onChange={(e) => setWithdrawForm({...withdrawForm, accountNumber: e.target.value})}
                  required
                  placeholder="Enter account number"
                  maxLength="10"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bankName">Bank Name</label>
                <input
                  type="text"
                  id="bankName"
                  value={withdrawForm.bankName}
                  onChange={(e) => setWithdrawForm({...withdrawForm, bankName: e.target.value})}
                  required
                  placeholder="Enter bank name"
                />
              </div>

              <div className="payment-notice">
                <p><strong>Warning:</strong> This will transfer funds from the house wallet to your specified bank account. This action cannot be undone.</p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowWithdrawForm(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-danger"
                  disabled={!withdrawForm.amount || !withdrawForm.accountName || !withdrawForm.accountNumber || !withdrawForm.bankName || parseFloat(withdrawForm.amount) > houseBalance}
                >
                  Withdraw Funds
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
