import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { mockTenders } from '../data/mockTenders';

export async function seedTendersIfEmpty() {
  // Legacy global seeder, can remain empty or do basic check
  return;
}

export async function seedCompanyTendersIfEmpty(companyId: string, userId: string) {
  try {
    if (!companyId) return;
    
    const tendersCollectionRef = collection(db, 'tenders');
    const q = query(tendersCollectionRef, where('companyId', '==', companyId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`[BuildFlow AI] Seeding initial tenders for company ${companyId}...`);
      const batch = writeBatch(db);
      
      const companyTenders = [
        {
          title: "Construction of Six-Lane Elevated Highway Corridor on NH-47",
          referenceNumber: "NHAI/HQ/CORR/2026/T-104",
          department: "National Highways Authority of India",
          authority: "NHAI",
          category: "Roads & Highways",
          state: "Maharashtra",
          city: "Pune",
          estimatedValue: 4856000000,
          emdAmount: 48500000,
          documentFee: 50000,
          publishedDate: "2026-06-25",
          closingDate: "2026-08-15",
          openingDate: "2026-08-16",
          location: "Pune - Shirur Corridor",
          description: "Engineering, Procurement, and Construction (EPC) contract for construction of a 12.4 km six-lane elevated highway corridor between Pune and Shirur to reduce urban bottleneck congestion. Includes structural columns, precast girder segments, utility shifts, and integrated toll setups.",
          status: "Open",
          priority: "High",
          assignedTo: userId,
          tags: ["Highway", "Elevated Corridor", "EPC"],
          notes: [
            {
              id: "note-1",
              author: "System Seeder",
              text: "Initial eligibility check passed. AI match score: 92%. Excellent category alignment with Roadways.",
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          documents: [
            {
              id: "doc-1",
              name: "Technical_Specifications_Corridor.pdf",
              url: "https://www.nhai.gov.in/technical_specifications.pdf",
              type: "application/pdf",
              size: 5242880, // 5MB
              uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          // Legacy mapping support for compatibility
          tenderNumber: "NHAI/HQ/CORR/2026/T-104",
          value: 485.60,
          valueUnit: "Crores",
          publishDate: "2026-06-25",
          deadlineDate: "2026-08-15",
          aiMatchScore: 92,
          aiMatchReasoning: "Excellent category alignment with Roadways. Company annual turnover matches the financial eligibility capability of 3x tender value over average of last 3 years.",
          aiKeyRequirements: [
            "Minimum 10 years experience in building heavy elevated steel or concrete corridors",
            "Completed at least 2 highway projects of similar length in the last 5 years",
            "Bid Security / EMD of INR 4.85 Crores via Bank Guarantee"
          ],
          aiEligibilityCheck: true
        },
        {
          title: "Construction of Multi-Speciality Medical College and Hospital Complex",
          referenceNumber: "CPWD/DEL/MED/2026/894",
          department: "Central Public Works Department",
          authority: "CPWD",
          category: "Civil Buildings",
          state: "Delhi",
          city: "Rohini",
          estimatedValue: 1248000000,
          emdAmount: 12400000,
          documentFee: 25000,
          publishedDate: "2026-06-28",
          closingDate: "2026-07-30",
          openingDate: "2026-07-31",
          location: "Rohini, Sector 15",
          description: "Design and construction of double-basement plus 12-storey medical college, multi-specialty hospital, residential hostels, and dynamic diagnostic blocks at Rohini, Delhi. High focus on precast RCC structures, smart green plumbing, and centralized HVAC systems.",
          status: "Preparing",
          priority: "Critical",
          assignedTo: userId,
          tags: ["Hospital", "Medical College", "Precast"],
          notes: [
            {
              id: "note-2",
              author: "System Seeder",
              text: "CPWD Class-I registration is verified. Reviewing HVAC specs with engineering team.",
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          documents: [],
          // Legacy mapping support
          tenderNumber: "CPWD/DEL/MED/2026/894",
          value: 124.80,
          valueUnit: "Crores",
          publishDate: "2026-06-28",
          deadlineDate: "2026-07-30",
          aiMatchScore: 85,
          aiMatchReasoning: "Matches building categories. Location in Delhi offers optimal logistics and labor support, satisfying local compliance checklists.",
          aiKeyRequirements: [
            "CPWD Class-I Super Composite builder registration",
            "Average annual financial turnover exceeding INR 80 Crores in the past 3 seasons",
            "Experience with green building standards (minimum GRIHA 3-star rating equivalent)"
          ],
          aiEligibilityCheck: true
        },
        {
          title: "Water Supply Distribution System and Treatment Plant in Malda District",
          referenceNumber: "PHED/WB/MALDA/2026/02",
          department: "Public Health Engineering Department",
          authority: "PHED West Bengal",
          category: "Water Supply & Sewerage",
          state: "West Bengal",
          city: "Malda",
          estimatedValue: 421500000,
          emdAmount: 4200000,
          documentFee: 10000,
          publishedDate: "2026-07-01",
          closingDate: "2026-08-10",
          openingDate: "2026-08-11",
          location: "Malda District",
          description: "Implementation of comprehensive piped drinking water supply scheme in Malda. Includes building of a 40 MLD water treatment plant, intake well in Ganga river, laying of 120 km DI distribution piping network, and construction of 12 overhead reservoirs.",
          status: "Won",
          priority: "Medium",
          assignedTo: userId,
          tags: ["Water Treatment", "Piping Network", "PHED"],
          notes: [
            {
              id: "note-3",
              author: "System Seeder",
              text: "Bid won! Transitioning into design blueprints.",
              createdAt: new Date().toISOString()
            }
          ],
          documents: [],
          // Legacy mapping
          tenderNumber: "PHED/WB/MALDA/2026/02",
          value: 42.15,
          valueUnit: "Crores",
          publishDate: "2026-07-01",
          deadlineDate: "2026-08-10",
          aiMatchScore: 78,
          aiMatchReasoning: "Good match if your company has plumbing, pipe-laying or treatment expertise. Lower budget makes it highly accessible with minimal equity margins.",
          aiKeyRequirements: [
            "Successful completion of 1 water treatment plant of minimum 15 MLD capability",
            "Experience laying at least 50 km pipe in a single network in the last 7 seasons"
          ],
          aiEligibilityCheck: true
        },
        {
          title: "Smart City Office Plaza & Command Control Center",
          referenceNumber: "SCDL/KTK/BLR/2026/41",
          department: "Smart City Bengaluru",
          authority: "SCDL",
          category: "Civil Buildings",
          state: "Karnataka",
          city: "Bengaluru",
          estimatedValue: 85000000,
          emdAmount: 850000,
          documentFee: 5000,
          publishedDate: "2026-06-15",
          closingDate: "2026-07-10",
          openingDate: "2026-07-11",
          location: "Koramangala, Bengaluru",
          description: "Design, supply, and construction of smart command & control center with server rooms, office cabins, conferencing chambers, energy-efficient facades, solar roofing, and complete IoT BMS integrations.",
          status: "Submitted",
          priority: "High",
          assignedTo: userId,
          tags: ["Smart City", "Office", "B BMS"],
          notes: [],
          documents: [],
          // Legacy mapping
          tenderNumber: "SCDL/KTK/BLR/2026/41",
          value: 85.00,
          valueUnit: "Lakhs",
          publishDate: "2026-06-15",
          deadlineDate: "2026-07-10",
          aiMatchScore: 90,
          aiMatchReasoning: "Excellent category alignment and local presence in Karnataka makes resources highly mobile.",
          aiKeyRequirements: ["Smart BMS integration certification", "Workforce clearance"],
          aiEligibilityCheck: true
        },
        {
          title: "Draft Design for Metro Station Expansion Line 2",
          referenceNumber: "BMRCL/EXP/L2/2026",
          department: "Bengaluru Metro Rail Corporation",
          authority: "BMRCL",
          category: "Bridges & Metro",
          state: "Karnataka",
          city: "Bengaluru",
          estimatedValue: 150000000,
          emdAmount: 1500000,
          documentFee: 12000,
          publishedDate: "2026-07-02",
          closingDate: "2026-08-25",
          openingDate: "2026-08-26",
          location: "Indiranagar, Bengaluru",
          description: "Structural strengthening, expansion of passenger concourse areas, installation of passenger safety screens, and construction of foot overbridges at three active Line 2 metro stations.",
          status: "Draft",
          priority: "Low",
          assignedTo: "",
          tags: ["Metro", "Station", "BMRCL"],
          notes: [],
          documents: [],
          // Legacy mapping
          tenderNumber: "BMRCL/EXP/L2/2026",
          value: 15.00,
          valueUnit: "Crores",
          publishDate: "2026-07-02",
          deadlineDate: "2026-08-25",
          aiMatchScore: 65,
          aiMatchReasoning: "Requires heavy crane mobilization which might over-allocate our logistics.",
          aiKeyRequirements: ["Metro rail structural experience"],
          aiEligibilityCheck: false
        },
        {
          title: "High-Priority Runway Repair & Lighting Upgrades",
          referenceNumber: "AAI/MUM/RWY/2026/09",
          department: "Airports Authority of India",
          authority: "AAI",
          category: "Roads & Highways",
          state: "Maharashtra",
          city: "Mumbai",
          estimatedValue: 320000000,
          emdAmount: 3200000,
          documentFee: 15000,
          publishedDate: "2026-06-10",
          closingDate: "2026-07-15",
          openingDate: "2026-07-16",
          location: "CSIA Airport, Mumbai",
          description: "Pavement milling, micro-surfacing, structural re-asphalting, and complete CAT-III lighting system upgrades for runway 09/27 at Chhatrapati Shivaji Maharaj International Airport.",
          status: "Evaluation",
          priority: "Critical",
          assignedTo: userId,
          tags: ["Airport", "Runway", "Lighting"],
          notes: [],
          documents: [],
          // Legacy mapping
          tenderNumber: "AAI/MUM/RWY/2026/09",
          value: 32.00,
          valueUnit: "Crores",
          publishDate: "2026-06-10",
          deadlineDate: "2026-07-15",
          aiMatchScore: 88,
          aiMatchReasoning: "Strong asphalt work experience fits the profile. Airport clearances required.",
          aiKeyRequirements: ["AAI clearance certification", "CAT III lighting engineers on staff"],
          aiEligibilityCheck: true
        }
      ];

      companyTenders.forEach((tenderData) => {
        const newDocRef = doc(tendersCollectionRef);
        const now = new Date().toISOString();
        
        batch.set(newDocRef, {
          ...tenderData,
          id: newDocRef.id,
          companyId,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
        });
      });

      await batch.commit();
      console.log(`[BuildFlow AI] Seeding completed for company ${companyId}`);
    } else {
      console.log(`[BuildFlow AI] Company ${companyId} already has tenders. Skipping seeder.`);
    }
  } catch (err) {
    console.error(`[BuildFlow AI] Error seeding company tenders:`, err);
  }
}
