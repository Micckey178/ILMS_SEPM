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
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { LaboratoryType } from '../types';

export const SpecializedModulesPage: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<LaboratoryType>('chemistry');

  const modules = [
    { id: 'chemistry', name: 'Chemistry & Reagents', icon: FlaskConical },
    { id: 'physics', name: 'Physics & Optics', icon: Atom },
    { id: 'computer_science', name: 'Computer Science & AI', icon: Binary },
    { id: 'biology', name: 'Biology & Specimens', icon: Microscope },
    { id: 'electronics', name: 'Electronics & ECE', icon: Cpu },
    { id: 'mechanical', name: 'Mechanical & CNC', icon: Cog },
    { id: 'civil', name: 'Civil & Geotechnical', icon: HardHat },
    { id: 'biotechnology', name: 'Biotech & Culture', icon: Dna },
  ];

  return (
    <div className="space-y-6">
      {/* PAGE HEADING */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold uppercase tracking-wider mb-2">
          <Activity className="w-3.5 h-3.5 text-cyan-600" />
          <span>Discipline-Specific Laboratory Operations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
          Specialized Laboratory Domain Modules
        </h1>
        <p className="text-sm sm:text-base text-[#5B6478] mt-1 font-medium max-w-3xl">
          Discipline-specific research protocols, hazardous materials registers, instrumentation telemetry, and computational infrastructure across all university departments.
        </p>
      </div>

      {/* HORIZONTAL CLEAN LIGHT NAVIGATION BAR */}
      <div className="p-1.5 bg-white border border-[#E4E7F0] rounded-2xl flex items-center overflow-x-auto shadow-card no-scrollbar">
        <div className="flex space-x-1.5 min-w-max p-0.5">
          {modules.map((m) => {
            const Icon = m.icon;
            const isActive = selectedModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModule(m.id as LaboratoryType)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  isActive
                    ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm font-extrabold'
                    : 'text-[#5B6478] hover:text-[#172033] hover:bg-[#F5F6FC]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-700' : 'text-[#5B6478]'}`} />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* UNIFORM LIGHT CARD CONTAINER MATCHING BACKGROUND UI */}
      <div className="bg-white border border-[#E4E7F0] rounded-3xl p-6 sm:p-8 space-y-6 shadow-card text-[#172033]">

        {/* 1. CHEMISTRY MODULE */}
        {selectedModule === 'chemistry' && (
          <div className="space-y-6">
            <div className="border-b border-[#E4E7F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#172033] flex items-center gap-2.5">
                  <FlaskConical className="w-6 h-6 text-cyan-600" />
                  <span>Chemical Inventory, CAS Registry & Hazardous Protocol</span>
                </h2>
                <p className="text-sm text-[#5B6478] mt-1">
                  Chemical safety compliance, Safety Data Sheet (SDS) verification, and certified acid/solvent storage records.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-mono font-bold self-start sm:self-auto">
                GHS / OSHA Standards
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Acids & Corrosives</span>
                <h3 className="font-bold text-base text-[#172033]">Hydrochloric Acid 37% Reagent Grade</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5 font-mono">
                  <div>CAS Number: <strong className="text-[#172033]">7647-01-0</strong></div>
                  <div>Hazard Classification: <span className="text-rose-600 font-semibold">Corrosive / Acute Toxicity</span></div>
                  <div>Storage Vault: Acid Cabinet A-1 (Ventilated)</div>
                  <div>Batch: B-2026-091 • Expiry: 2027-11-30</div>
                </div>
                <div className="pt-2 border-t border-[#E4E7F0]">
                  <a
                    href="https://pubchem.ncbi.nlm.nih.gov/#query=7647-01-0"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-600 hover:underline flex items-center space-x-1.5 font-bold"
                  >
                    <span>Inspect PubChem SDS Sheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Flammable Solvents</span>
                <h3 className="font-bold text-base text-[#172033]">Ethanol Absolute (99.8% Spectroscopy)</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5 font-mono">
                  <div>CAS Number: <strong className="text-[#172033]">64-17-5</strong></div>
                  <div>Hazard Classification: <span className="text-amber-600 font-semibold">Flammable Liquid (Class 3)</span></div>
                  <div>Flash Point: 13°C • Storage: Flammables Vault F-02</div>
                  <div>Batch: ET-2026-44 • Current Volume: 8.5 Litres</div>
                </div>
                <div className="pt-2 border-t border-[#E4E7F0]">
                  <a
                    href="https://pubchem.ncbi.nlm.nih.gov/#query=64-17-5"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-600 hover:underline flex items-center space-x-1.5 font-bold"
                  >
                    <span>Inspect PubChem SDS Sheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Containment Telemetry</span>
                <h3 className="font-bold text-base text-[#172033]">Fume Hood Dynamic Airflow</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5">
                  <div>Main Hood #1: <span className="text-emerald-600 font-bold">104 fpm (Nominal)</span></div>
                  <div>Synthesis Hood #2: <span className="text-emerald-600 font-bold">98 fpm (Optimal)</span></div>
                  <div>Solvent Waste Containment: <span className="text-cyan-700 font-medium">Negative Pressure Verified</span></div>
                  <div>Face Velocity Threshold: ≥ 100 fpm required</div>
                </div>
                <div className="pt-2 border-t border-[#E4E7F0] text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sash Sensors Operational</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PHYSICS MODULE */}
        {selectedModule === 'physics' && (
          <div className="space-y-6">
            <div className="border-b border-[#E4E7F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#172033] flex items-center gap-2.5">
                  <Atom className="w-6 h-6 text-cyan-600" />
                  <span>Optics Benches, Interferometers & Experimental Kits</span>
                </h2>
                <p className="text-sm text-[#5B6478] mt-1">
                  Laser safety certifications, vibration-isolated optical tables, and instrument calibration logs.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-mono font-bold">
                Laser Safety Class 3R
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Optics Instrumentation</span>
                <h3 className="font-bold text-base text-[#172033]">Michelson Interferometer Precision Optical Bench</h3>
                <p className="text-xs text-[#5B6478] leading-relaxed">
                  Thorlabs EDU-MINT2 assembly with beam splitters, precision translation stage, and stabilized He-Ne laser source (632.8nm).
                </p>
                <div className="p-3 bg-white border border-[#E4E7F0] rounded-xl text-xs space-y-1 font-mono text-[#5B6478]">
                  <div>Vibration Frame: Newport Pneumatic Isolation Table #1</div>
                  <div>Laser Source: Class 3R 2.0mW He-Ne (Calibrated)</div>
                  <div>Experiment Protocol: EXP-PH-OPTICS-2026</div>
                </div>
              </div>

              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Telemetry & Signal Kits</span>
                <h3 className="font-bold text-base text-[#172033]">Keysight InfiniiVision 200MHz 4-Channel DSO Kit</h3>
                <p className="text-xs text-[#5B6478] leading-relaxed">
                  High-speed digital storage oscilloscope paired with arbitrary waveform synthesizer for harmonic frequency analysis.
                </p>
                <div className="p-3 bg-white border border-[#E4E7F0] rounded-xl text-xs space-y-1 font-mono text-[#5B6478]">
                  <div>Sampling Rate: 2.0 GSa/s real-time</div>
                  <div>Calibrated Probes: 4x 10:1 Passive 500V Cat II</div>
                  <div>Checkout Status: <span className="text-emerald-600 font-bold">Available for Faculty Reservation</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. COMPUTER SCIENCE & AI MODULE */}
        {selectedModule === 'computer_science' && (
          <div className="space-y-6">
            <div className="border-b border-[#E4E7F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#172033] flex items-center gap-2.5">
                  <Binary className="w-6 h-6 text-cyan-600" />
                  <span>AI Workstations, Compute Clusters & Campus Licenses</span>
                </h2>
                <p className="text-sm text-[#5B6478] mt-1">
                  GPU server telemetry, high-performance computing clusters, operating system images, and software seat allocations.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-mono font-bold">
                10GbE Research Subnet
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">AI Compute Engine</span>
                <h3 className="font-bold text-base text-[#172033]">NVIDIA DGX Station A100</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5 font-mono">
                  <div>GPU Architecture: 4x A100 80GB SXM4</div>
                  <div>System Memory: 512GB DDR4 ECC</div>
                  <div>Storage Array: 7.68TB NVMe U.2 SSD</div>
                  <div>Workstation Status: <span className="text-emerald-600 font-bold">Available</span></div>
                </div>
              </div>

              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Software Seats</span>
                <h3 className="font-bold text-base text-[#172033]">MATLAB & Simulink Campus</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5 font-mono">
                  <div>Active Licenses: 45 / 50 Allocated</div>
                  <div>Toolboxes: Parallel Computing, Neural Net</div>
                  <div>License Server: flexlm.institution.edu</div>
                  <div>Renewal Date: 2027-01-31</div>
                </div>
              </div>

              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Core Networking</span>
                <h3 className="font-bold text-base text-[#172033]">Cisco Catalyst 9300 48P</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5 font-mono">
                  <div>Ports: 48-Port PoE+ with 10GbE Uplinks</div>
                  <div>VLAN: Isolated Research Subnet 192.168.40.0</div>
                  <div>Firmware: IOS-XE 17.9.4a Verified</div>
                  <div>Hardware Uptime: 99.98%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. BIOLOGY MODULE */}
        {selectedModule === 'biology' && (
          <div className="space-y-6">
            <div className="border-b border-[#E4E7F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#172033] flex items-center gap-2.5">
                  <Microscope className="w-6 h-6 text-cyan-600" />
                  <span>Specimen Registry, -80°C Cryo Storage & Biosafety</span>
                </h2>
                <p className="text-sm text-[#5B6478] mt-1">
                  Cell line cryogenic logging, Biosafety Level 2 (BSL-2) containment, and tissue culture tracking.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-mono font-bold">
                BSL-2 Active Containment
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Cryogenic Storage</span>
                  <span className="text-xs text-cyan-700 font-mono flex items-center gap-1 font-bold">
                    <Thermometer className="w-3.5 h-3.5" />
                    -80.4°C Steady
                  </span>
                </div>
                <h3 className="font-bold text-base text-[#172033]">Thermo Scientific Forma -80°C Cryo Vault</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5 font-mono">
                  <div>Freezer Serial: CRYO-DARWIN-01</div>
                  <div>Location: Darwin Biological Complex D-201</div>
                  <div>Sample Count: 480 / 600 Vials (80% Capacity)</div>
                  <div>Alarm Monitoring: Dual redundant generator connected</div>
                </div>
              </div>

              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Bio-Containment</span>
                <h3 className="font-bold text-base text-[#172033]">Biological Safety Cabinet Class II Type A2</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5 font-mono">
                  <div>Certification: HEPA H14 filter validated (99.995%)</div>
                  <div>UV Decontamination: 15 min pre/post cycle verified</div>
                  <div>Authorized Scope: Non-pathogenic cell cultures only</div>
                  <div>Next Certification: November 2026</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. ELECTRONICS MODULE */}
        {selectedModule === 'electronics' && (
          <div className="space-y-6">
            <div className="border-b border-[#E4E7F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#172033] flex items-center gap-2.5">
                  <Cpu className="w-6 h-6 text-cyan-600" />
                  <span>Microcontrollers, FPGA Development & SMD Rework</span>
                </h2>
                <p className="text-sm text-[#5B6478] mt-1">
                  Embedded kits, logic analyzers, soldering workbenches, and electrostatic discharge (ESD) safety.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-mono font-bold">
                ESD Grounding Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Embedded Dev Kits</span>
                <h3 className="font-bold text-base text-[#172033]">ESP32-S3 & STM32F4 Discovery Cohort Kits</h3>
                <p className="text-xs text-[#5B6478] leading-relaxed">
                  Full student developmental kits containing microcontroller, breadboards, logic probe, and sensor peripherals.
                </p>
                <div className="p-3 bg-white border border-[#E4E7F0] rounded-xl text-xs space-y-1 font-mono text-[#5B6478]">
                  <div>Total Kits in Roster: 35 sets (31 currently deployed)</div>
                  <div>Standard Loan Period: 14 days maximum</div>
                  <div>Kit Inventory ID: ELEC-KIT-ESP32-V2</div>
                </div>
              </div>

              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">SMD Prototyping</span>
                <h3 className="font-bold text-base text-[#172033]">Hakko FR-810B SMD Hot Air Rework Station</h3>
                <div className="p-3 bg-white border border-[#E4E7F0] rounded-xl text-xs space-y-1 font-mono text-[#5B6478]">
                  <div>ESD Verification: Continuous wrist-strap grounding verified</div>
                  <div>Fume Extraction: Activated carbon filter replaced Feb 2026</div>
                  <div>Profile Attachments: QFP, SOP, BGA rework nozzles</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. MECHANICAL MODULE */}
        {selectedModule === 'mechanical' && (
          <div className="space-y-6">
            <div className="border-b border-[#E4E7F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#172033] flex items-center gap-2.5">
                  <Cog className="w-6 h-6 text-cyan-600" />
                  <span>CNC Machining, Tooling Crib & Spindle Telemetry</span>
                </h2>
                <p className="text-sm text-[#5B6478] mt-1">
                  Precision vertical machining centers, machine operating hours, and tooling crib checkout records.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-mono font-bold">
                OSHA Workshop Guarding
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">CNC Machining Center</span>
                <h3 className="font-bold text-base text-[#172033]">Haas VF-2SS Super-Speed Vertical Mill</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5 font-mono">
                  <div>Spindle Operating Hours: <strong className="text-[#172033]">1,482 Hours</strong></div>
                  <div>Coolant Concentration: 8.5% (Refractometer verified)</div>
                  <div>Next Way Lube Inspection: April 20, 2026</div>
                  <div>Door Interlock Safety: <span className="text-emerald-600 font-bold">Engaged & Tested</span></div>
                </div>
              </div>

              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Tooling Inventory</span>
                <h3 className="font-bold text-base text-[#172033]">Solid Carbide End Mill Tooling Crib</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5 font-mono">
                  <div>10mm 4-Flute TiAlN Cutters: 18 pcs Available</div>
                  <div>6mm Ball Nose Roughers: 12 pcs Available</div>
                  <div>Tool Holder Types: CAT40 ER-32 Collet Chuchs</div>
                  <div>Checkout: Barcode scan required upon issue</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. CIVIL MODULE */}
        {selectedModule === 'civil' && (
          <div className="space-y-6">
            <div className="border-b border-[#E4E7F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#172033] flex items-center gap-2.5">
                  <HardHat className="w-6 h-6 text-cyan-600" />
                  <span>Universal Testing Machine (UTM) & Geotechnical Logs</span>
                </h2>
                <p className="text-sm text-[#5B6478] mt-1">
                  Concrete compression failure records, soil triaxial shear logs, and surveying total stations.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-mono font-bold">
                ISO/IEC 17025 Calibrated
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Material Testing</span>
                <h3 className="font-bold text-base text-[#172033]">UTM 1000kN Hydraulic Compression & Tensile Frame</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5 font-mono">
                  <div>Maximum Load Capacity: 1000 kN (100 Metric Tons)</div>
                  <div>Extensometer: 50mm High-Precision Digital Sensor</div>
                  <div>Load Cell Calibration: Verified Jan 2026 (NABL Accredited)</div>
                  <div>Test Standards: ASTM C39 / IS 516 Concrete Testing</div>
                </div>
              </div>

              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Field Surveying</span>
                <h3 className="font-bold text-base text-[#172033]">Leica Geosystems Total Station TS16</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5 font-mono">
                  <div>Angular Accuracy: 1" (1 second of arc)</div>
                  <div>Prism Range: 10,000m with single circular prism</div>
                  <div>Kit Contents: Tribrach, heavy-duty wooden tripod, prism pole</div>
                  <div>Field Readiness: <span className="text-emerald-600 font-bold">Leveled and Available</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. BIOTECHNOLOGY MODULE */}
        {selectedModule === 'biotechnology' && (
          <div className="space-y-6">
            <div className="border-b border-[#E4E7F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#172033] flex items-center gap-2.5">
                  <Dna className="w-6 h-6 text-cyan-600" />
                  <span>Autoclave Sterilization & Bioreactor Fermentation</span>
                </h2>
                <p className="text-sm text-[#5B6478] mt-1">
                  Batch trace records, sterilization pressure cycle curves, and automated microbial growth logs.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-mono font-bold">
                Sterility Trace Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Sterilization Systems</span>
                <h3 className="font-bold text-base text-[#172033]">Tuttnauer 3870EL Autoclave Sterilizer</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5 font-mono">
                  <div>Cycle Temperature: 121°C @ 15 psi (30 min hold)</div>
                  <div>Biological Indicator: Geobacillus stearothermophilus NEGATIVE</div>
                  <div>Chamber Capacity: 85 Litres stainless steel</div>
                  <div>Last Validation Cycle: 2026-02-28 (Pass)</div>
                </div>
              </div>

              <div className="p-5 bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl space-y-3">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Fermentation Telemetry</span>
                <h3 className="font-bold text-base text-[#172033]">Sartorius Biostat B 5L Benchtop Bioreactor</h3>
                <div className="text-xs text-[#5B6478] space-y-1.5 font-mono">
                  <div>Vessel Configuration: 5L Water-jacketed glass vessel</div>
                  <div>Online Telemetry: pH, DO (Dissolved O2), Temp, Agitation</div>
                  <div>Impeller Speed: 250 rpm (Batch Fermentation Active)</div>
                  <div>CIP Protocol: Clean-in-place completed and signed</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SpecializedModulesPage;
