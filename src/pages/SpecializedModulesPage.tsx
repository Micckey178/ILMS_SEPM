import React, { useState } from 'react';
import {
  FlaskConical,
  Atom,
  Binary,
  Microscope,
  Cpu,
  Cog,
  HardHat,
  Dna,
  FileText,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Thermometer,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LaboratoryType } from '../types';

export const SpecializedModulesPage: React.FC = () => {
  const { activeLab } = useAuth();
  const [selectedModule, setSelectedModule] = useState<LaboratoryType>(activeLab?.type || 'chemistry');

  const modules = [
    { id: 'chemistry', name: 'Chemistry & Reagents', icon: FlaskConical, color: 'text-sky-400' },
    { id: 'physics', name: 'Physics & Optics', icon: Atom, color: 'text-indigo-400' },
    { id: 'computer_science', name: 'Computer Science & AI', icon: Binary, color: 'text-emerald-400' },
    { id: 'biology', name: 'Biology & Specimens', icon: Microscope, color: 'text-teal-400' },
    { id: 'electronics', name: 'Electronics & ECE', icon: Cpu, color: 'text-amber-400' },
    { id: 'mechanical', name: 'Mechanical & CNC', icon: Cog, color: 'text-orange-400' },
    { id: 'civil', name: 'Civil & Geotechnical', icon: HardHat, color: 'text-yellow-400' },
    { id: 'biotechnology', name: 'Biotech & Culture', icon: Dna, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <FlaskConical className="w-5 h-5 text-sky-400" />
          <span>Specialized Laboratory Domain Modules</span>
        </h2>
        <p className="text-xs text-slate-400">
          Field-specific workflows, CAS hazardous data, specimen registers, and hardware specifications
        </p>
      </div>

      {/* Module Selector Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
        {modules.map((m) => {
          const Icon = m.icon;
          const isActive = selectedModule === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedModule(m.id as LaboratoryType)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : m.color}`} />
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>

      {/* Module Dynamic Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 shadow-xl">
        {/* CHEMISTRY MODULE */}
        {selectedModule === 'chemistry' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-sky-400" />
                  <span>Chemical Inventory, CAS Registry & Hazard Ratings</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Chemical safety compliance, Safety Data Sheet (SDS) links, and fume hood containment verification.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                OSHA / GHS Compliant
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">ACIDS & BASES</span>
                <h4 className="font-bold text-sm text-slate-100">Hydrochloric Acid 37%</h4>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>CAS: <strong>7647-01-0</strong></div>
                  <div>Hazard: <span className="text-rose-400 font-semibold">Corrosive / Toxic</span></div>
                  <div>Storage: Acid Cabinet A-1</div>
                </div>
                <div className="pt-2">
                  <a
                    href="https://pubchem.ncbi.nlm.nih.gov/#query=7647-01-0"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1"
                  >
                    <span>Inspect PubChem SDS</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">FLAMMABLE SOLVENTS</span>
                <h4 className="font-bold text-sm text-slate-100">Ethanol Absolute (99.8%)</h4>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>CAS: <strong>64-17-5</strong></div>
                  <div>Hazard: <span className="text-amber-400 font-semibold">Flammable Liquid (Class 3)</span></div>
                  <div>Flash Point: 13°C (Flammables Vault F-02)</div>
                </div>
                <div className="pt-2">
                  <a
                    href="https://pubchem.ncbi.nlm.nih.gov/#query=64-17-5"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1"
                  >
                    <span>Inspect PubChem SDS</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">CONTAINMENT</span>
                <h4 className="font-bold text-sm text-slate-100">Fume Hood Airflow Status</h4>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Hood 1: <span className="text-emerald-400 font-semibold">102 fpm (Optimal)</span></div>
                  <div>Hood 2: <span className="text-rose-400 font-semibold">Blocked for Calibration</span></div>
                  <div>Face Velocity Threshold: ≥ 100 fpm</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHYSICS MODULE */}
        {selectedModule === 'physics' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Atom className="w-5 h-5 text-indigo-400" />
                  <span>Optics, Lasers & Experimental Apparatus Kits</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Optoelectronic alignment, vibration-isolated table reservations, and experiment observation logs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-slate-100">Michelson Interferometer Optical Bench</h4>
                <p className="text-xs text-slate-400">
                  Thorlabs EDU-MINT2 assembly with beam splitters, precision translation stage, and He-Ne laser source.
                </p>
                <div className="p-2.5 bg-slate-900 rounded-lg text-xs space-y-1 font-mono text-slate-300">
                  <div>Laser Safety: Class 3R (632.8nm He-Ne)</div>
                  <div>Optical Table: Newport Vibration Isolation Frame #1</div>
                  <div>Observation Protocol: EXP-PH-OPTICS-2026</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-slate-100">Digital Storage Oscilloscope & Signal Generator Kit</h4>
                <p className="text-xs text-slate-400">
                  Keysight InfiniiVision 200MHz 4-channel DSO + arbitrary waveform synthesizer.
                </p>
                <div className="p-2.5 bg-slate-900 rounded-lg text-xs space-y-1 font-mono text-slate-300">
                  <div>Bandwidth: 200 MHz, 2 GSa/s</div>
                  <div>Probes: 4x 10:1 Passive Probes calibrated</div>
                  <div>Status: Verified and Ready for checkout</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CS & IT MODULE */}
        {selectedModule === 'computer_science' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Binary className="w-5 h-5 text-emerald-400" />
                  <span>AI Workstations, Software Licenses & IT Incident Tickets</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Hardware specification registry, seat license allocations, and server cluster allocation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">AI SERVER CLUSTER</span>
                <h4 className="font-bold text-sm text-slate-100">NVIDIA DGX Station A100</h4>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>GPU: 4x NVIDIA A100 80GB SXM4</div>
                  <div>RAM: 512GB DDR4 ECC</div>
                  <div>Storage: 7.68TB NVMe U.2 SSD</div>
                  <div>Status: <span className="text-emerald-400 font-semibold">Available for Scheduling</span></div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">SOFTWARE LICENSES</span>
                <h4 className="font-bold text-sm text-slate-100">MATLAB & Simulink Campus</h4>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>Seats Allocated: 45 / 50 Active</div>
                  <div>Toolboxes: Parallel Computing, DSP</div>
                  <div>Expiry: 2027-01-31</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">NETWORKING</span>
                <h4 className="font-bold text-sm text-slate-100">Cisco Catalyst 9300 Switch</h4>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>Ports: 48-Port PoE+ 10GbE Uplinks</div>
                  <div>VLAN: Isolated Research Subnet</div>
                  <div>Firmware: IOS-XE 17.9.4a Verified</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BIOLOGY MODULE */}
        {selectedModule === 'biology' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-teal-400" />
                  <span>Specimen Registry, -80°C Cryo Storage & Biosafety</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Cell line tracking, biosafety level 2 containment, and sample movement audit logs.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-mono font-bold">
                BSL-2 Protocol Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-100">Ultra-Low Temperature Cryo Vault</h4>
                  <span className="flex items-center text-xs text-sky-400 font-mono">
                    <Thermometer className="w-3.5 h-3.5 mr-1" />
                    -80.4°C
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Freezer ID: <span className="text-slate-200 font-mono">CRYO-FREEZER-01</span></div>
                  <div>Location: Darwin Complex D-201</div>
                  <div>Capacity: 480 / 600 Sample Vials (80% full)</div>
                  <div>Alarm: Dual redundant power backup connected</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-slate-100">Biological Safety Cabinet Class II A2</h4>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Certification: HEPA filter certified 2026-01-12</div>
                  <div>UV Decontamination Cycle: 15 min pre/post usage</div>
                  <div>Allowed: Non-pathogenic cellular strains, tissue cultures</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MECHANICAL MODULE */}
        {selectedModule === 'mechanical' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cog className="w-5 h-5 text-orange-400" />
                  <span>CNC Machining, Tooling Crib & Spindle Hours</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Precision vertical machining centers, machine hour telemetry, and cutting tool checkout.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-slate-100">Haas VF-2SS Super-Speed CNC Mill</h4>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>Spindle Run Hours: <strong className="text-slate-100">1,482 hrs</strong></div>
                  <div>Coolant Concentration: 8.5% Refractometer verified</div>
                  <div>Next Way Lube Inspection: 2026-04-20</div>
                  <div>Safety Interlock: Fully Operational</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-slate-100">Solid Carbide End Mill Tooling Crib</h4>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>10mm 4-Flute TiAlN: 18 pcs available</div>
                  <div>6mm Ball Nose Roughers: 12 pcs available</div>
                  <div>Tool Holders: CAT40 ER-32 collet sets</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ELECTRONICS MODULE */}
        {selectedModule === 'electronics' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-400" />
                  <span>Microcontrollers, FPGA Developers & SMD Rework</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Reusable embedded dev kits, component consumption, and ESD workbench calibration.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-slate-100">ESP32-S3 & STM32F4 Discovery Kits</h4>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>Kits in Stock: 35 sets</div>
                  <div>Kit Components: Dev board, breadboard, sensors, jumper wires</div>
                  <div>Checkout Period: 14 days maximum</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-slate-100">Hakko SMD Hot Air Rework Station</h4>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>ESD Grounding: Continuous wrist-strap monitor connected</div>
                  <div>Fume Extractor: Filter replaced Feb 2026</div>
                  <div>Nozzle Attachments: QFP, SOP, BGA profiles included</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CIVIL MODULE */}
        {selectedModule === 'civil' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-yellow-400" />
                  <span>Universal Testing Machine (UTM) & Geotechnical Soil Shear</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Concrete compression failure records, soil triaxial shear logs, and surveying total stations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-slate-100">UTM 1000kN Hydraulic Compression & Tensile Frame</h4>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>Capacity: 1000 kN (100 Tons)</div>
                  <div>Extensometer: 50mm Gauge Length High Precision</div>
                  <div>Calibration Certificate: ISO/IEC 17025 Compliant</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-slate-100">Leica Geosystems Total Station TS16</h4>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Angular Accuracy: 1" (1 second of arc)</div>
                  <div>Range: 10,000m with single prism</div>
                  <div>Status: Cleaned, leveled, and available for fieldwork</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BIOTECHNOLOGY MODULE */}
        {selectedModule === 'biotechnology' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Dna className="w-5 h-5 text-purple-400" />
                  <span>Autoclave Sterilization Logs & Bioreactor Fermentation</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Batch trace records, sterilization pressure cycles, and automated microbial growth monitoring.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-slate-100">Tuttnauer 3870EL Autoclave Sterilizer</h4>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>Cycle Protocol: 121°C @ 15 psi for 30 min</div>
                  <div>Biological Indicator: Geobacillus stearothermophilus negative test verified</div>
                  <div>Chamber Volume: 85 Litres</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-slate-100">Sartorius Biostat B 5L Benchtop Bioreactor</h4>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Vessel: 5L Water-jacketed glass vessel</div>
                  <div>Parameters Logged: pH, DO (Dissolved O2), Temp, Agitation</div>
                  <div>Sterility Status: Clean-in-place completed</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
