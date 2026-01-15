import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Houses.css';

const Houses = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [house, setHouse] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);

  // Create house form
  const [createForm, setCreateForm] = useState({
    name: '',
    address: '',
  });

  // Join house form
  const [joinForm, setJoinForm] = useState({
    code: '',
    name: '',
    roomId: ''
  });

  useEffect(() => {
    fetchHouseData();
  }, []);

  const fetchHouseData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/house/my-house');
      setHouse(response.data);

      if (response.data) {
        // Use populated members from the house data, filter out null values
        setMembers((response.data.tenants || []).filter(member => member != null));
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
      // Use the populated members from the response
      setMembers(response.data.house.tenants || []);
      // Refresh user data to update houseId in context
      await refreshUser();
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
      const response = await api.post('/house/join', joinForm);
      setHouse(response.data.house);
      await fetchHouseData(); // Refresh to get updated member list
      // Refresh user data to update houseId in context
      await refreshUser();
      setShowJoinForm(false);
      setJoinForm({ code: '', name: '', roomId: '' });
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

  const handleRemoveMember = async (memberId, memberEmail) => {
    if (!window.confirm(`Are you sure you want to remove ${memberEmail} from the house?`)) return;

    try {
      await api.put('/house/manage', {
        action: 'remove',
        userId: memberId
      });
      await fetchHouseData(); // Refresh the house data
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to remove member');
    }
  };

  const handlePromoteMember = async (memberId, memberEmail) => {
    if (!window.confirm(`Are you sure you want to promote ${memberEmail} to admin?`)) return;

    try {
      await api.put('/house/manage', {
        action: 'promote',
        userId: memberId
      });
      await fetchHouseData(); // Refresh the house data
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to promote member');
    }
  };

  const handleDemoteMember = async (memberId, memberEmail) => {
    if (!window.confirm(`Are you sure you want to demote ${memberEmail} from admin?`)) return;

    try {
      await api.put('/house/manage', {
        action: 'demote',
        userId: memberId
      });
      await fetchHouseData(); // Refresh the house data
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to demote member');
    }
  };

  const handleDeleteHouse = async () => {
    if (!window.confirm('Are you sure you want to DELETE this house? This action cannot be undone and will remove all members and bills.')) return;

    try {
      await api.delete('/house/delete');
      setHouse(null);
      setMembers([]);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete house');
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
                    <label htmlFor="code">House Code</label>
                    <input
                      type="text"
                      id="code"
                      value={joinForm.code}
                      onChange={(e) => setJoinForm({...joinForm, code: e.target.value.toUpperCase()})}
                      required
                      placeholder="Enter house code"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="name">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      value={joinForm.name}
                      onChange={(e) => setJoinForm({...joinForm, name: e.target.value})}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="roomId">Room ID</label>
                    <input
                      type="text"
                      id="roomId"
                      value={joinForm.roomId}
                      onChange={(e) => setJoinForm({...joinForm, roomId: e.target.value})}
                      required
                      placeholder="e.g., A101, B205"
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
                <strong>House Admin:</strong>
                <span>{house.tenants?.find(tenant => tenant._id.toString() === house.adminId.toString())?.email || 'Unknown'}</span>
              </div>
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
              {house.isAdmin && (
                <div className="admin-actions">
                  <button className="btn-danger" onClick={handleDeleteHouse}>
                    🗑️ Delete House
                  </button>
                </div>
              )}
              <button className="btn-danger" onClick={handleLeaveHouse}>
                🚪 Leave House
              </button>
            </div>
          </div>

          <div className="members-card">
            <h3>House Members ({members.length})</h3>
            {house.isAdmin && (
              <p className="admin-note">As house admin, you can promote/demote members and remove them from the house.</p>
            )}
            <div className="members-list">
              {members.map(member => (
                <div key={member._id} className="member-item">
                  <div className="member-info">
                    <span className="member-email">{member.email}</span>
                    {member._id.toString() === house.adminId.toString() && <span className="admin-badge">Admin</span>}
                  </div>
                  <div className="member-role">
                    {member.role === 'admin' ? 'Administrator' : 'Tenant'}
                  </div>
                  {house.isAdmin && member._id.toString() !== user._id && (
                    <div className="member-actions">
                      {member._id.toString() === house.adminId.toString() ? (
                        <button
                          className="btn-warning"
                          onClick={() => handleDemoteMember(member._id, member.email)}
                          title="Demote from admin"
                        >
                          👎 Demote
                        </button>
                      ) : (
                        <button
                          className="btn-secondary"
                          onClick={() => handlePromoteMember(member._id, member.email)}
                          title="Promote to admin"
                        >
                          👑 Promote
                        </button>
                      )}
                      <button
                        className="btn-danger"
                        onClick={() => handleRemoveMember(member._id, member.email)}
                        title="Remove from house"
                      >
                        🚫 Remove
                      </button>
                    </div>
                  )}
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
