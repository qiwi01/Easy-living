import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Houses.css';

const Houses = () => {
  const { user } = useContext(AuthContext);
  const [house, setHouse] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  // Create house form
  const [createForm, setCreateForm] = useState({
    name: '',
    address: '',
  });

  // Join house form
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    fetchHouseData();
  }, []);

  const fetchHouseData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/house/my-house');
      setHouse(response.data);

      if (response.data) {
        // Use populated members from the house data
        setMembers(response.data.tenants || []);
      }
    } catch (err) {
      // No house found, which is normal for new users
      if (err.response?.status !== 400) {
        setError('Failed to load house data');
      }
      setHouse(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHouse = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/house/create', createForm);
      setHouse(response.data.house);
      setMembers([user]); // Add current user as first member
      setShowCreateForm(false);
      setCreateForm({ name: '', address: '' });
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create house');
    }
  };

  const handleJoinHouse = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/house/join', { code: joinCode });
      setHouse(response.data.house);
      await fetchHouseData(); // Refresh to get updated member list
      setShowJoinForm(false);
      setJoinCode('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to join house');
    }
  };

  const handleLeaveHouse = async () => {
    if (!window.confirm('Are you sure you want to leave this house?')) return;

    try {
      await api.post('/house/leave');
      setHouse(null);
      setMembers([]);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to leave house');
    }
  };

  if (loading) {
    return (
      <div className="houses">
        <div className="loading">Loading house information...</div>
      </div>
    );
  }

  return (
    <div className="houses">
      <div className="page-header">
        <h1>My House</h1>
        <p>Manage your house group and members</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!house ? (
        <div className="no-house-section">
          <div className="house-actions">
            <button
              className="btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              Create New House
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowJoinForm(true)}
            >
              Join Existing House
            </button>
          </div>

          {/* Create House Form */}
          {showCreateForm && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>Create New House</h3>
                  <button
                    className="close-btn"
                    onClick={() => setShowCreateForm(false)}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleCreateHouse} className="modal-form">
                  <div className="form-group">
                    <label htmlFor="name">House Name</label>
                    <input
                      type="text"
                      id="name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                      required
                      placeholder="Enter house name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address">Address (Optional)</label>
                    <input
                      type="text"
                      id="address"
                      value={createForm.address}
                      onChange={(e) => setCreateForm({...createForm, address: e.target.value})}
                      placeholder="Enter house address"
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Create House
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Join House Form */}
          {showJoinForm && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>Join House</h3>
                  <button
                    className="close-btn"
                    onClick={() => setShowJoinForm(false)}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleJoinHouse} className="modal-form">
                  <div className="form-group">
                    <label htmlFor="joinCode">House Code</label>
                    <input
                      type="text"
                      id="joinCode"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      required
                      placeholder="Enter house code"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowJoinForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Join House
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="house-details">
          <div className="house-info-card">
            <div className="house-header">
              <h2>{house.name}</h2>
              {house.isAdmin && <span className="admin-badge">Admin</span>}
            </div>

            <div className="house-details-grid">
              <div className="detail-item">
                <strong>House Code:</strong>
                <span className="code-display">{house.joinCode}</span>
              </div>
              <div className="detail-item">
                <strong>Address:</strong>
                <span>{house.address || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <strong>Members:</strong>
                <span>{members.length}</span>
              </div>
              <div className="detail-item">
                <strong>Created:</strong>
                <span>{new Date(house.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="house-actions">
              <button className="btn-danger" onClick={handleLeaveHouse}>
                Leave House
              </button>
            </div>
          </div>

          <div className="members-card">
            <h3>House Members</h3>
            <div className="members-list">
              {members.map(member => (
                <div key={member._id} className="member-item">
                  <div className="member-info">
                    <span className="member-email">{member.email}</span>
                    {member._id === house.admin && <span className="admin-badge">Admin</span>}
                  </div>
                  <div className="member-role">
                    {member.role === 'admin' ? 'Administrator' : 'Tenant'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Houses;
