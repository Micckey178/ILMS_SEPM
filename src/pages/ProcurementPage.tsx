import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  XCircle,
  PackageCheck,
  AlertTriangle,
  Clock,
  FileText,
  X,
  Building2,
  ShieldCheck,
  BadgeCheck,
  Search,
  Filter,
  Truck,
  ExternalLink,
  ChevronRight,
  Layers,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { formatINR } from '../utils/formatCurrency';
import { PurchaseRequest, CertifiedVendor, VendorCatalogProduct, VendorVerificationStatus } from '../types';

export const ProcurementPage: React.FC = () => {
  const { activeLab, currentUser, can } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'vendors' | 'catalog'>('requests');
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [vendors, setVendors] = useState<CertifiedVendor[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<VendorCatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState('ALL');

  // New PR Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [justification, setJustification] = useState('');
  const [budgetCode, setBudgetCode] = useState('CHEM-GRANT-2026');
  const [itemsList, setItemsList] = useState<{ name: string; category: string; quantity: number; estimatedUnitCost: number; supplier?: string }[]>([
    { name: '', category: 'Consumables', quantity: 1, estimatedUnitCost: 50.00, supplier: '' }
  ]);

  // Admin Vendor Verification Modal
  const [verifyingVendor, setVerifyingVendor] = useState<CertifiedVendor | null>(null);
  const [certNumber, setCertNumber] = useState('');
  const [certDocUrl, setCertDocUrl] = useState('');
  const [certExpiry, setCertExpiry] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [prData, vData, pData] = await Promise.all([
        DataService.getPurchaseRequests(activeLab?.id),
        DataService.getVendors(),
        DataService.getVendorProducts()
      ]);
      setRequests(prData);
      setVendors(vData);
      setCatalogProducts(pData);
    } catch (err) {
      console.error('Failed to load procurement data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [activeLab]);

  const handleAddItemRow = () => {
    setItemsList([
      ...itemsList,
      { name: '', category: 'Consumables', quantity: 1, estimatedUnitCost: 20.00, supplier: '' }
    ]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...itemsList];
    (updated[index] as any)[field] = value;
    setItemsList(updated);
  };

  const totalCost = itemsList.reduce((acc, curr) => acc + (Number(curr.quantity || 0) * Number(curr.estimatedUnitCost || 0)), 0);

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || itemsList.length === 0 || !itemsList[0].name.trim()) {
      alert('Please fill out all mandatory purchase request fields.');
      return;
    }

    try {
      await DataService.createPurchaseRequest({
        title,
        laboratoryId: activeLab?.id || 'lab-chem-01',
        requestedBy: currentUser.id,
        requestedByName: currentUser.displayName,
        items: itemsList,
        totalEstimatedCost: totalCost,
        currency: 'INR',
        justification,
        departmentBudgetCode: budgetCode
      }, currentUser);
      setIsAddModalOpen(false);
      setTitle('');
      setJustification('');
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprove = async (pr: PurchaseRequest) => {
    if (pr.requestedBy === currentUser.id && currentUser.role !== 'admin') {
      alert('Self-Approval Forbidden: An independent Lab Manager or Institution Admin must approve your purchase request.');
      return;
    }

    try {
      await DataService.updatePurchaseRequestStatus(
        pr.id,
        'APPROVED',
        currentUser,
        `Approved by ${currentUser.displayName} (${currentUser.role}). Dispatched to institutional procurement officer.`
      );
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOrder = async (pr: PurchaseRequest) => {
    const poNumber = prompt('Enter official Purchase Order (PO) Number:', `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    if (!poNumber) return;

    try {
      await DataService.updatePurchaseRequestStatus(
        pr.id,
        'ORDER_PLACED',
        currentUser,
        `Purchase Order ${poNumber} issued to verified vendor. Awaiting shipment.`
      );
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReceive = async (pr: PurchaseRequest) => {
    const confirmed = confirm('Confirm that physical goods have arrived, quantities verified, and stock levels should be auto-updated in Universal Inventory?');
    if (!confirmed) return;

    try {
      await DataService.updatePurchaseRequestStatus(
        pr.id,
        'RECEIVED',
        currentUser,
        `Shipment received and verified by ${currentUser.displayName}. Universal Inventory stock credited.`
      );
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddProductToPR = (prod: VendorCatalogProduct) => {
    setTitle(`Procurement Request for ${prod.name}`);
    setItemsList([
      {
        name: `${prod.name} (${prod.modelNumber})`,
        category: prod.category,
        quantity: prod.minOrderQuantity || 1,
        estimatedUnitCost: prod.unitPrice,
        supplier: prod.vendorName
      }
    ]);
    setActiveTab('requests');
    setIsAddModalOpen(true);
  };

  const handleVerifyVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingVendor || !certNumber.trim()) return;

    try {
      await DataService.verifyVendor(
        verifyingVendor.id,
        certNumber,
        certExpiry || '2028-12-31',
        currentUser
      );
      setVerifyingVendor(null);
      setCertNumber('');
      setCertDocUrl('');
      setCertExpiry('');
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getVerificationBadge = (status: VendorVerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'DOCUMENTS_PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';
      case 'REGISTERED':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300';
      case 'EXPIRED':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300';
      case 'SUSPENDED':
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              Institutional Marketplace & Orders
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">
              Audit-Compliant Purchasing
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            Procurement & Certified Vendors
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-xl">
            Streamlined workflow from product selection and vendor compliance verification to multi-tier purchase approval, PO issuance, and automated goods receipt.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-extrabold rounded-2xl text-xs sm:text-sm flex items-center space-x-2 shadow-md transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-[#172033]" />
          <span>New Purchase Request</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-border dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'requests'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Purchase Orders & Requests ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'vendors'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Certified Vendor Directory ({vendors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'catalog'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Verified Product Catalog ({catalogProducts.length})</span>
        </button>
      </div>

      {/* TAB 1: PURCHASE REQUESTS & ORDERS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-[#E4E7F0] rounded-3xl shadow-soft">
              <span className="text-[10px] uppercase font-bold text-[#5B6478]">Total Requests</span>
              <p className="font-heading font-black text-2xl text-[#172033] mt-1">{requests.length}</p>
            </div>
            <div className="p-4 bg-white border border-[#E4E7F0] rounded-3xl shadow-soft">
              <span className="text-[10px] uppercase font-bold text-amber-600">Pending Review</span>
              <p className="font-heading font-black text-2xl text-amber-600 mt-1">
                {requests.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length}
              </p>
            </div>
            <div className="p-4 bg-white border border-[#E4E7F0] rounded-3xl shadow-soft">
              <span className="text-[10px] uppercase font-bold text-cyan-600">Orders Dispatched</span>
              <p className="font-heading font-black text-2xl text-cyan-600 mt-1">
                {requests.filter(r => r.status === 'ORDER_PLACED').length}
              </p>
            </div>
            <div className="p-4 bg-white border border-[#E4E7F0] rounded-3xl shadow-soft">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Goods Received</span>
              <p className="font-heading font-black text-2xl text-emerald-600 mt-1">
                {requests.filter(r => r.status === 'RECEIVED').length}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-card overflow-hidden">
            <div className="divide-y divide-[#E4E7F0]">
              {requests.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs">
                  No active purchase requests found. Click "New Purchase Request" or browse the Verified Product Catalog to create one.
                </div>
              ) : (
                requests.map(pr => {
                  const canApprove = (currentUser.role === 'admin' || currentUser.role === 'labManager') &&
                    (pr.status === 'SUBMITTED' || pr.status === 'UNDER_REVIEW');
                  const canOrder = (currentUser.role === 'admin' || currentUser.role === 'labManager') && pr.status === 'APPROVED';
                  const canReceive = (currentUser.role === 'admin' || currentUser.role === 'labManager' || currentUser.role === 'technician') && pr.status === 'ORDER_PLACED';

                  return (
                    <div key={pr.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-heading font-extrabold text-base text-foreground dark:text-white">
                            {pr.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 font-bold">
                            {pr.departmentBudgetCode}
                          </span>
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-foreground dark:text-slate-200">
                            {pr.status}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {pr.justification}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                          <span>Items: <strong className="text-foreground dark:text-slate-200">{pr.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</strong></span>
                          <span>Total Estimated: <strong className="text-purple-600 dark:text-purple-400 font-mono">{formatINR(pr.totalEstimatedCost)}</strong></span>
                          <span>Requested by <strong className="text-foreground dark:text-slate-200">{pr.requestedByName}</strong></span>
                        </div>
                      </div>

                      {/* Workflow Actions */}
                      <div className="flex items-center space-x-2 shrink-0">
                        {canApprove && (
                          <button
                            onClick={() => handleApprove(pr)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Request</span>
                          </button>
                        )}

                        {canOrder && (
                          <button
                            onClick={() => handleOrder(pr)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Issue PO</span>
                          </button>
                        )}

                        {canReceive && (
                          <button
                            onClick={() => handleReceive(pr)}
                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Receive Goods</span>
                          </button>
                        )}

                        {pr.status === 'RECEIVED' && (
                          <span className="text-xs text-emerald-600 font-extrabold flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Stock Credited</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CERTIFIED VENDOR DIRECTORY */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-extrabold text-base text-foreground dark:text-white">
                Institutional Certified Vendors & Compliance Directory
              </h3>
              <p className="text-xs text-muted-foreground">
                College-approved vendors for chemical reagents, analytical apparatus, electronic modules, and safety PPE.
              </p>
            </div>
            {currentUser.role === 'admin' && (
              <span className="text-xs text-purple-600 font-bold bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 rounded-xl border border-purple-200">
                Admin Verification Authorized
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vendors.map(vendor => (
              <div
                key={vendor.id}
                className="p-6 bg-white border border-[#E4E7F0] rounded-3xl shadow-card hover:shadow-card-hover transition flex flex-col justify-between space-y-4 text-[#172033]"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-heading font-black text-lg text-[#172033]">
                        {vendor.name}
                      </h4>
                      <p className="text-xs text-[#5B6478]">{vendor.serviceAreas.join(', ')}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${getVerificationBadge(vendor.verificationStatus)}`}>
                      {vendor.verificationStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F5F6FC] rounded-2xl border border-[#E4E7F0] text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#5B6478]">Registration No:</span>
                      <span className="font-mono font-bold text-[#172033]">{vendor.companyRegistrationNumber || 'Pending'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6478]">Certification:</span>
                      <span className="font-mono font-bold text-cyan-700">{vendor.certificationDetails}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categories:</span>
                      <span className="font-medium text-foreground dark:text-white">{vendor.categories.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Warranty / Support:</span>
                      <span className="font-medium text-foreground dark:text-white">{vendor.warrantyPolicy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rating:</span>
                      <span className="font-bold text-amber-500">★ {vendor.rating.toFixed(1)} / 5.0</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Contact: <strong className="text-foreground dark:text-slate-200">{vendor.email}</strong></p>
                    <p>Phone: <strong className="text-foreground dark:text-slate-200">{vendor.phone}</strong></p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {vendor.verificationExpiryDate ? `Valid until ${vendor.verificationExpiryDate}` : 'Verification unconfirmed'}
                  </span>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setVerifyingVendor(vendor);
                        setCertNumber(vendor.certificationDetails || `ISO-9001-QUAL-${Math.floor(100000 + Math.random() * 900000)}`);
                        setCertExpiry(vendor.verificationExpiryDate || '2028-12-31');
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Audit / Verify
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VERIFIED PRODUCT CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-extrabold text-base text-foreground dark:text-white">
                Institutional Product Catalog & Supplies Marketplace
              </h3>
              <p className="text-xs text-muted-foreground">
                Browse pre-approved supplies, compare models, and click "Requisition" to start the order requisition.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {catalogProducts.map(product => (
              <div
                key={product.id}
                className="p-6 bg-white border border-[#E4E7F0] rounded-3xl shadow-card hover:shadow-card-hover transition flex flex-col justify-between space-y-4 text-[#172033]"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold">
                      {product.category}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600">
                      {product.availability === 'IN_STOCK' ? 'In Stock' : 'Lead Time Required'}
                    </span>
                  </div>

                  <h4 className="font-heading font-black text-base text-[#172033]">
                    {product.name}
                  </h4>

                  <p className="text-xs text-[#5B6478] line-clamp-2">
                    {product.specifications}
                  </p>

                  <div className="p-3 bg-[#F5F6FC] rounded-2xl border border-[#E4E7F0] text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#5B6478]">Manufacturer / Model:</span>
                      <span className="font-semibold text-[#172033]">{product.manufacturer} {product.modelNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6478]">Verified Supplier:</span>
                      <span className="font-semibold text-cyan-700">{product.vendorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6478]">Warranty Period:</span>
                      <span className="font-semibold text-[#172033]">{product.warrantyMonths} Months</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E4E7F0] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#5B6478] block">Unit Price (INR)</span>
                    <span className="font-heading font-black text-lg text-cyan-700">
                      {formatINR(product.unitPrice)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddProductToPR(product)}
                    className="px-4 py-2 bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Requisition</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE PURCHASE REQUEST MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col text-[#172033]">
            <div className="p-6 bg-white border-b border-[#E4E7F0] flex items-center justify-between">
              <h3 className="font-heading font-black text-xl text-[#172033]">
                Create Institutional Purchase Request
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-[#5B6478] hover:text-[#172033] rounded-xl hover:bg-[#F5F6FC] transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePR} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Requisition Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Replenishment of Grade 1 Solvents and Analytical Columns"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Department Budget Code
                  </label>
                  <input
                    type="text"
                    value={budgetCode}
                    onChange={e => setBudgetCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Estimated Total Cost
                  </label>
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono font-bold text-sm text-purple-600">
                    {formatINR(totalCost)}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Required Items / SKUs
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-purple-600 font-bold hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {itemsList.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-border dark:border-slate-700">
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Item Name"
                          value={item.name}
                          onChange={e => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-border dark:border-slate-700 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Supplier"
                          value={item.supplier || ''}
                          onChange={e => handleItemChange(idx, 'supplier', e.target.value)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-border dark:border-slate-700 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-border dark:border-slate-700 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Cost"
                          value={item.estimatedUnitCost}
                          onChange={e => handleItemChange(idx, 'estimatedUnitCost', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-border dark:border-slate-700 rounded text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Academic / Research Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="State curriculum requirements, research project grant ID, or stock replenishment need..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-foreground dark:text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-md shadow-purple-500/20"
                >
                  Submit For Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN VENDOR VERIFICATION MODAL */}
      {verifyingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 bg-gradient-to-r from-purple-700 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase bg-white/20 px-2.5 py-0.5 rounded-full font-bold">Admin Verification</span>
                <h3 className="font-heading font-black text-xl text-white mt-1">Audit Vendor Credentials</h3>
              </div>
              <button onClick={() => setVerifyingVendor(null)} className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyVendorSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Vendor Name:</span>
                <p className="font-heading font-black text-base text-foreground dark:text-white">{verifyingVendor.name}</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Official Accreditation / License Details <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={certNumber}
                  onChange={e => setCertNumber(e.target.value)}
                  placeholder="e.g. ISO-9001:2015 Analytical Quality Certification"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Verification Expiry Date
                </label>
                <input
                  type="date"
                  value={certExpiry}
                  onChange={e => setCertExpiry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Accreditation Document Archive URL
                </label>
                <input
                  type="url"
                  value={certDocUrl}
                  onChange={e => setCertDocUrl(e.target.value)}
                  placeholder="https://ilms.inst.edu/compliance/cert.pdf"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setVerifyingVendor(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-foreground dark:text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
                >
                  Confirm & Seal Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
