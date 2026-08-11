import { Tender } from '../types';

export const mockTenders: Partial<Tender>[] = [
  {
    title: "Construction of Six-Lane Elevated Highway Corridor on NH-47",
    tenderNumber: "NHAI/HQ/CORR/2026/T-104",
    authority: "National Highways Authority of India (NHAI)",
    value: 485.60,
    valueUnit: "Crores",
    publishDate: "2026-06-25",
    deadlineDate: "2026-08-15",
    state: "Maharashtra",
    category: "Roads & Highways",
    description: "Engineering, Procurement, and Construction (EPC) contract for construction of a 12.4 km six-lane elevated highway corridor between Pune and Shirur to reduce urban bottleneck congestion. Includes structural columns, precast girder segments, utility shifts, and integrated toll setups.",
    aiMatchScore: 92,
    aiMatchReasoning: "Excellent category alignment with Roadways. Company annual turnover matches the financial eligibility capability of 3x tender value over average of last 3 years.",
    aiKeyRequirements: [
      "Minimum 10 years experience in building heavy elevated steel or concrete corridors",
      "Completed at least 2 highway projects of similar length in the last 5 years",
      "Bid Security / EMD of INR 4.85 Crores via Bank Guarantee"
    ],
    aiEligibilityCheck: true,
    status: "Open"
  },
  {
    title: "Construction of Multi-Speciality Medical College and Hospital Complex",
    tenderNumber: "CPWD/DEL/MED/2026/894",
    authority: "Central Public Works Department (CPWD)",
    value: 124.80,
    valueUnit: "Crores",
    publishDate: "2026-06-28",
    deadlineDate: "2026-07-30",
    state: "Delhi",
    category: "Civil Buildings",
    description: "Design and construction of double-basement plus 12-storey medical college, multi-specialty hospital, residential hostels, and dynamic diagnostic blocks at Rohini, Delhi. High focus on precast RCC structures, smart green plumbing, and centralized HVAC systems.",
    aiMatchScore: 85,
    aiMatchReasoning: "Matches building categories. Location in Delhi offers optimal logistics and labor support, satisfying local compliance checklists.",
    aiKeyRequirements: [
      "CPWD Class-I Super Composite builder registration",
      "Average annual financial turnover exceeding INR 80 Crores in the past 3 seasons",
      "Experience with green building standards (minimum GRIHA 3-star rating equivalent)"
    ],
    aiEligibilityCheck: true,
    status: "Open"
  },
  {
    title: "Water Supply Distribution System and Treatment Plant in Malda District",
    tenderNumber: "PHED/WB/MALDA/2026/02",
    authority: "Public Health Engineering Department, West Bengal",
    value: 42.15,
    valueUnit: "Crores",
    publishDate: "2026-07-01",
    deadlineDate: "2026-08-10",
    state: "West Bengal",
    category: "Water Supply & Sewerage",
    description: "Implementation of comprehensive piped drinking water supply scheme in Malda. Includes building of a 40 MLD water treatment plant, intake well in Ganga river, laying of 120 km DI distribution piping network, and construction of 12 overhead reservoirs.",
    aiMatchScore: 78,
    aiMatchReasoning: "Good match if your company has plumbing, pipe-laying or treatment expertise. Lower budget makes it highly accessible with minimal equity margins.",
    aiKeyRequirements: [
      "Successful completion of 1 water treatment plant of minimum 15 MLD capability",
      "Active Class-A civil registration in West Bengal or adjacent state PWD",
      "Joint Ventures accepted up to a limit of 49% participation"
    ],
    aiEligibilityCheck: true,
    status: "Open"
  },
  {
    title: "Construction of Ballastless Metro Track & Underground Station Works",
    tenderNumber: "MMRDA/METRO-4/TRACK/2026",
    authority: "Mumbai Metropolitan Region Development Authority",
    value: 320.00,
    valueUnit: "Crores",
    publishDate: "2026-06-18",
    deadlineDate: "2026-07-25",
    state: "Maharashtra",
    category: "Railways & Metros",
    description: "Detailed engineering design, supply, installation, testing and commissioning of ballastless track of standard gauge for metro corridors, including underground station civil and structural concrete finishes.",
    aiMatchScore: 64,
    aiMatchReasoning: "Requires highly specialized ballastless railway track laying machinery. If your company focuses purely on civil buildings, a joint-venture with a railway specialist is strictly required.",
    aiKeyRequirements: [
      "Proven track record of laying at least 15 Track-Kilometers of ballastless tracks",
      "Certified ISO 9001, 14001 and 45001 company compliance",
      "Solvency certificate from scheduled commercial bank for at least INR 50 Crores"
    ],
    aiEligibilityCheck: false,
    status: "Open"
  },
  {
    title: "Reconstruction of 12 RCC Smart Bridges on State Highway 12",
    tenderNumber: "PWD/KAR/BRG/2026-11",
    authority: "Public Works Department, Karnataka",
    value: 18.50,
    valueUnit: "Crores",
    publishDate: "2026-07-02",
    deadlineDate: "2026-08-05",
    state: "Karnataka",
    category: "Bridges & Flyovers",
    description: "Dismantling of existing structurally compromised narrow brick arches and construction of high-strength 2-lane Reinforced Cement Concrete (RCC) box girder bridges. Includes dynamic approach roads, flood protection walls, and solar lightings.",
    aiMatchScore: 89,
    aiMatchReasoning: "Highly profitable short-term projects that perfectly fit medium-tier construction companies looking for steady localized cash flows.",
    aiKeyRequirements: [
      "Registered Class-I contractor with Karnataka PWD",
      "Owning key masonry, soil compactors, concrete transit mixers, and excavators",
      "Completion of at least 3 RCC bridges under any state government authority"
    ],
    aiEligibilityCheck: true,
    status: "Open"
  }
];
