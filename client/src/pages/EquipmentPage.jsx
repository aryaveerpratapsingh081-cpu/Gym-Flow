import React, { useEffect, useState } from 'react';
import { Wrench, Plus, AlertTriangle, CheckCircle2, Clock, Calendar, RefreshCw, Search } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function EquipmentPage() {
  const { isAdmin } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Strength');
  const [serialNumber, setSerialNumber] = useState('');
  const [condition, setCondition] = useState('Good');
  const [location, setLocation] = useState('Main Floor');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [cost, setCost] = useState('');

  // Service form
  const [technician, setTechnician] = useState('');
  const [serviceType, setServiceType] = useState('Routine Inspection');
  const [serviceCost, setServiceCost] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [intervalDays, setIntervalDays] = useState(90);

  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (categoryFilter !== 'All') query.append('category', categoryFilter);
      if (conditionFilter !== 'All') query.append('condition', conditionFilter);
      if (search) query.append('search', search);

      const res = await API.get(`/equipment?${query.toString()}`);
      if (res.data.success) {
        setEquipmentList(res.data.data);
        setStats(res.data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [categoryFilter, conditionFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEquipment();
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await API.post('/equipment', {
        name,
        category,
        serialNumber,
        condition,
        location,
        nextServiceDate,
        cost: Number(cost) || 0
      });
      if (res.data.success) {
        setMsg('Equipment registered successfully!');
        setShowAddModal(false);
        fetchEquipment();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add equipment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordService = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      const res = await API.post(`/equipment/${selectedItem._id}/service`, {
        technician,
        serviceType,
        cost: Number(serviceCost) || 0,
        notes: serviceNotes,
        nextServiceIntervalDays: Number(intervalDays)
      });
      if (res.data.success) {
        setMsg(`Maintenance recorded for ${selectedItem.name}!`);
        setShowServiceModal(false);
        fetchEquipment();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record maintenance');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Gym Equipment & Maintenance</h1>
          <p className="text-xs text-slate-400 mt-1">
            Asset Tracking • Preventive Maintenance Logs • 7-Day Due Date Projection Queries
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Machine</span>
            </button>
          )}
          <button
            onClick={fetchEquipment}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Total Assets</div>
          <div className="text-xl font-black text-white">{stats?.total || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Catalogued machines</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Operational</div>
          <div className="text-xl font-black text-emerald-400">{stats?.operational || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ready for members</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Service Due in 7 Days</div>
          <div className="text-xl font-black text-amber-400">{stats?.dueWithin7Days || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Preventive inspection</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Overdue Servicing</div>
          <div className="text-xl font-black text-red-400">{stats?.overdue || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Requires immediate attention</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment name or serial..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white focus:outline-none"
          />
        </form>

        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Strength">Strength</option>
            <option value="Cardio">Cardio</option>
            <option value="Free Weights">Free Weights</option>
            <option value="Machines">Machines</option>
            <option value="Functional">Functional</option>
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="All">All Conditions</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Needs Maintenance">Needs Maintenance</option>
            <option value="Out of Order">Out of Order</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-400 bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Equipment / Serial</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Floor Location</th>
                <th className="py-3 px-4">Last Serviced</th>
                <th className="py-3 px-4">Next Service Due</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">Loading equipment assets...</td>
                </tr>
              ) : equipmentList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">No equipment found matching criteria.</td>
                </tr>
              ) : (
                equipmentList.map((item) => {
                  const isDueSoon = new Date(item.nextServiceDate) - new Date() <= 7 * 24 * 60 * 60 * 1000;
                  const isOverdue = new Date(item.nextServiceDate) < new Date();

                  return (
                    <tr key={item._id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.serialNumber || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.condition === 'Excellent' || item.condition === 'Good'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {item.condition}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{item.location}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {item.lastServiceDate ? new Date(item.lastServiceDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-semibold ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : 'text-slate-300'}`}>
                          {new Date(item.nextServiceDate).toLocaleDateString()}
                        </div>
                        {isOverdue && <span className="text-[10px] text-red-400 font-bold">OVERDUE</span>}
                        {!isOverdue && isDueSoon && <span className="text-[10px] text-amber-400">Due within 7d</span>}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowServiceModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Log Service</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register Gym Equipment">
          <form onSubmit={handleAddEquipment} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Equipment Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Olympic Barbell Power Rack"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                >
                  <option value="Strength">Strength</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Free Weights">Free Weights</option>
                  <option value="Machines">Machines</option>
                  <option value="Functional">Functional</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Serial Number</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="EQ-PR-01"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Needs Maintenance">Needs Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Floor Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Main Floor / Heavy Bay"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Next Service Due *</label>
                <input
                  type="date"
                  required
                  value={nextServiceDate}
                  onChange={(e) => setNextServiceDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Purchase Cost (₹)</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="65000"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl cursor-pointer"
              >
                {actionLoading ? 'Saving...' : 'Add Equipment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Log Service Modal */}
      {showServiceModal && selectedItem && (
        <Modal isOpen={showServiceModal} onClose={() => setShowServiceModal(false)} title={`Log Maintenance: ${selectedItem.name}`}>
          <form onSubmit={handleRecordService} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Technician / Agency *</label>
              <input
                type="text"
                required
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="Apex Fitness Tech Services"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                >
                  <option value="Routine Inspection">Routine Inspection</option>
                  <option value="Repair">Repair</option>
                  <option value="Parts Replacement">Parts Replacement</option>
                  <option value="Lubrication">Lubrication</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Cost (₹)</label>
                <input
                  type="number"
                  value={serviceCost}
                  onChange={(e) => setServiceCost(e.target.value)}
                  placeholder="2500"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Next Service In (Days)</label>
              <input
                type="number"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                placeholder="90"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Maintenance Notes</label>
              <textarea
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
                rows="2"
                placeholder="Adjusted belt tension, lubricated pulleys..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl cursor-pointer"
              >
                {actionLoading ? 'Recording...' : 'Complete & Schedule Next'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
