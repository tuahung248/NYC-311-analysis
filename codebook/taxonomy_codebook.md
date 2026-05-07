# NYC311 Taxonomy Codebook (v0.1.0)

Scope: NYC 311 cleaned slice (2022-2025) in `clean_311` mapped into 20 operational categories. Category names are uppercase with underscores for SQL-safe joins and dashboard filters.

Descriptor precedence rule: `descriptor_overrides.csv` is evaluated before `category_mapping.csv`; unmatched records fall back to `OTHER`.

## PARKING_ENFORCEMENT
- **Short definition:** Curb-space access and parking-rule compliance issues requiring ticketing/towing workflows.
- **Mapped complaint types/descriptors:** Illegal Parking (1,389,736), Blocked Driveway (492,997), Abandoned Vehicle (197,864), Derelict Vehicles (148,522), Broken Parking Meter (11,423), Abandoned Bike (6,245). Descriptor examples: Illegal Parking -> Blocked Hydrant (396,586); Blocked Driveway -> No Access (359,510); Illegal Parking -> Posted Parking Sign Violation (321,897); Abandoned Vehicle -> With License Plate (197,864)
- **Typical agency:** NYPD Traffic Enforcement; DOT; DSNY derelict-vehicle units.
- **Known DQ issue notes:** Location precision and duplicate reporting around high-conflict blocks can inflate apparent repeat volume.
- **Under-reporting risk notes:** Lower-trust neighborhoods may under-report illegal parking where expected enforcement follow-through is perceived as weak.
- **Current share (clean_311):** 2,250,322 requests (22.8486%).

## NOISE_AND_SOUND
- **Short definition:** Residential, street, vehicle, and commercial noise disturbances and related quality-of-life complaints.
- **Mapped complaint types/descriptors:** Noise - Residential (1,059,357), Noise - Street/Sidewalk (463,830), Noise - Commercial (197,448), Noise - Vehicle (164,881), Noise (155,224), Noise - Helicopter (114,053). Descriptor examples: Noise - Residential -> Loud Music/Party (672,421); Noise - Street/Sidewalk -> Loud Music/Party (374,429); Noise - Residential -> Banging/Pounding (300,279); Noise - Commercial -> Loud Music/Party (157,207)
- **Typical agency:** NYPD precinct response; DEP noise inspectors for source-specific cases.
- **Known DQ issue notes:** Noise descriptors are heterogeneous across source systems; some legacy internal DEP noise codes require normalization.
- **Under-reporting risk notes:** Under-reporting is likely where residents face language, time, or retaliation barriers for repeated after-hours reporting.
- **Current share (clean_311):** 2,183,768 requests (22.1729%).

## HOUSING_MAINTENANCE
- **Short definition:** In-unit and building-system habitability defects in residential properties.
- **Mapped complaint types/descriptors:** HEAT/HOT WATER (759,591), PLUMBING (184,905), PAINT/PLASTER (175,445), DOOR/WINDOW (132,391), WATER LEAK (124,036), GENERAL (85,341). Descriptor examples: HEAT/HOT WATER -> ENTIRE BUILDING (500,122); HEAT/HOT WATER -> APARTMENT ONLY (259,469); PAINT/PLASTER -> WALL (85,860); PAINT/PLASTER -> CEILING (78,964)
- **Typical agency:** HPD code enforcement and landlord compliance workflows.
- **Known DQ issue notes:** Mixed casing and duplicate complaint labels (e.g., HEAT/HOT WATER vs Heat/Hot Water) can fragment trend reads without standard mapping.
- **Under-reporting risk notes:** Tenants in precarious housing may under-report due to eviction concerns or landlord retaliation risk.
- **Current share (clean_311):** 1,838,917 requests (18.6714%).

## SANITATION_CLEANLINESS
- **Short definition:** Street and property cleanliness, missed waste collection, illegal dumping, and sanitation servicing quality.
- **Mapped complaint types/descriptors:** UNSANITARY CONDITION (335,682), Dirty Condition (151,331), Missed Collection (144,304), Illegal Dumping (103,479), Graffiti (54,131), Request Large Bulky Item Collection (47,008). Descriptor examples: UNSANITARY CONDITION -> PESTS (177,336); Dirty Condition -> Trash (134,683); UNSANITARY CONDITION -> MOLD (95,828); Illegal Dumping -> Removal Request (86,816)
- **Typical agency:** DSNY operations and borough sanitation garages.
- **Known DQ issue notes:** Some cleanliness descriptors overlap with health/environment complaints; strict category boundaries may shift with policy updates.
- **Under-reporting risk notes:** Areas with historically slow response can normalize poor conditions, reducing complaint propensity despite high objective need.
- **Current share (clean_311):** 975,259 requests (9.9023%).

## STREET_AND_SIDEWALK_INFRASTRUCTURE
- **Short definition:** Street-surface, sidewalk, signage, lighting, and right-of-way obstruction defects.
- **Mapped complaint types/descriptors:** Street Condition (214,494), Street Light Condition (109,929), Sidewalk Condition (70,252), Obstruction (49,593), Curb Condition (19,674), Street Sign - Damaged (14,797). Descriptor examples: Street Condition -> Pothole (124,801); Street Light Condition -> Street Light Out (77,136); Sidewalk Condition -> Sidewalk Violation (28,138); Sidewalk Condition -> Broken Sidewalk (27,425)
- **Typical agency:** DOT street/highway maintenance and lighting divisions.
- **Known DQ issue notes:** Descriptor granularity varies by intake channel; pothole/cave-in severity is not consistently encoded.
- **Under-reporting risk notes:** Digital divide and varying civic engagement can suppress reporting of recurring infrastructure defects in low-income areas.
- **Current share (clean_311):** 533,786 requests (5.4198%).

## WATER_AND_SEWER
- **Short definition:** Drinking-water, hydrant, leak, sewer backup, and drainage system service issues.
- **Mapped complaint types/descriptors:** Water System (182,689), Sewer (84,621), Water Conservation (11,155), Water Quality (3,512), Water Leak (3,055), Sewer Maintenance (2,813). Descriptor examples: Sewer -> Sewer Backup (Use Comments) (SA) (32,817); Water System -> Hydrant Running Full (WA4) (30,242); Water System -> Hydrant Running (WC3) (28,875); Water System -> Dirty Water (WE) (27,586)
- **Typical agency:** DEP Bureau of Water and Sewer Operations.
- **Known DQ issue notes:** Certain DEP descriptor taxonomies are code-heavy and require periodic translation checks when upstream code lists change.
- **Under-reporting risk notes:** Flooding and plumbing hazards may be under-reported where tenants rely on informal repair channels.
- **Current share (clean_311):** 290,886 requests (2.9535%).

## TREES_AND_NATURAL_RESOURCES
- **Short definition:** Tree health, branch hazards, roots, and vegetation-related right-of-way issues.
- **Mapped complaint types/descriptors:** Damaged Tree (85,199), New Tree Request (62,956), Overgrown Tree/Branches (61,271), Dead/Dying Tree (30,118), Root/Sewer/Sidewalk Condition (28,134), Illegal Tree Damage (13,547). Descriptor examples: New Tree Request -> For One Address (62,956); Damaged Tree -> Branch or Limb Has Fallen Down (34,875); Dead/Dying Tree -> Planted More Than 2 Years Ago (28,169); Root/Sewer/Sidewalk Condition -> Trees and Sidewalks Program (26,793)
- **Typical agency:** NYC Parks Forestry and related maintenance teams.
- **Known DQ issue notes:** Tree-condition severity is descriptor-driven and may not capture arborist-confirmed hazard level at intake time.
- **Under-reporting risk notes:** Complaints depend on awareness of jurisdiction (Parks vs private property), which differs by neighborhood.
- **Current share (clean_311):** 287,536 requests (2.9195%).

## HOMELESSNESS_AND_OUTREACH
- **Short definition:** Street homelessness assistance and encampment outreach requests.
- **Mapped complaint types/descriptors:** Encampment (120,168), Homeless Person Assistance (115,075). Descriptor examples: Homeless Person Assistance -> Non-Chronic (601); Homeless Person Assistance -> Chronic (277)
- **Typical agency:** DHS street outreach and coordinated encampment response teams.
- **Known DQ issue notes:** Encampment records frequently have null descriptors, limiting sub-type segmentation.
- **Under-reporting risk notes:** Reported encampments may reflect observer concentration and policing dynamics rather than true need distribution.
- **Current share (clean_311):** 235,243 requests (2.3885%).

## PUBLIC_SAFETY_AND_NUISANCE
- **Short definition:** Non-emergency public-order and nuisance activity needing field enforcement.
- **Mapped complaint types/descriptors:** Non-Emergency Police Matter (61,715), Drug Activity (49,488), Illegal Fireworks (30,265), Panhandling (26,264), Real Time Enforcement (16,781), Drinking (10,670). Descriptor examples: Drug Activity -> Use Outside (44,742); Non-Emergency Police Matter -> Other (complaint details) (44,039); Non-Emergency Police Matter -> Trespassing (17,531); Real Time Enforcement -> Work Without A Permit - Occupied Multiple Dwelling (16,780)
- **Typical agency:** NYPD quality-of-life response units and interagency emergency enforcement teams.
- **Known DQ issue notes:** Some enforcement categories blend DOB/NYPD workflows, creating agency attribution ambiguity in downstream benchmarking.
- **Under-reporting risk notes:** Communities with lower institutional trust may avoid reporting nuisance complaints unless immediate harm is evident.
- **Current share (clean_311):** 206,854 requests (2.1003%).

## BUILDING_AND_CONSTRUCTION
- **Short definition:** Construction compliance, unsafe work, building-use violations, and structural safety concerns.
- **Mapped complaint types/descriptors:** General Construction/Plumbing (113,431), Building/Use (57,205), Special Projects Inspection Team (SPIT) (13,411), Hazardous Materials (5,624), OUTSIDE BUILDING (3,104), BEST/Site Safety (1,387). Descriptor examples: Building/Use -> Illegal Conversion Of Residential Building/Space (41,456); General Construction/Plumbing -> Building Permit - None (30,510); General Construction/Plumbing -> Cons - Contrary/Beyond Approved Plans/Permits (10,298); General Construction/Plumbing -> Sidewalk Shed/Pipe Scafford - Inadequate Defective/None (9,984)
- **Typical agency:** DOB inspections, site-safety, and enforcement teams.
- **Known DQ issue notes:** Descriptor variants include long free-text-like labels; periodic standardization is needed for stable drill-down analytics.
- **Under-reporting risk notes:** Construction nuisance under-reporting can be higher in areas with less familiarity with DOB complaint channels.
- **Current share (clean_311):** 195,156 requests (1.9815%).

## ANIMAL_WELFARE
- **Short definition:** Rodent, domestic animal welfare, unleashed animals, and animal-condition hazards.
- **Mapped complaint types/descriptors:** Rodent (122,647), Animal-Abuse (25,088), Animal in a Park (15,345), Unsanitary Animal Pvt Property (6,737), Unleashed Dog (4,845), Unsanitary Pigeon Condition (3,477). Descriptor examples: Rodent -> Rat Sighting (77,173); Rodent -> Condition Attracting Rodents (21,333); Rodent -> Signs of Rodents (15,447); Animal-Abuse -> Neglected (12,321)
- **Typical agency:** DOHMH pest control, Animal Care Centers, and Parks enforcement depending on locus.
- **Known DQ issue notes:** Rodent descriptors are consistent, but non-rodent animal issues have lower volume and more heterogeneous labels.
- **Under-reporting risk notes:** Pet-related violations may be under-reported where complainants fear neighborhood conflict.
- **Current share (clean_311):** 184,595 requests (1.8743%).

## PUBLIC_HEALTH
- **Short definition:** Public health hazards, food safety, smoke/air risks, lead, and communicable risk complaints.
- **Mapped complaint types/descriptors:** Lead (45,178), Food Establishment (34,148), Air Quality (33,062), Indoor Air Quality (21,364), Smoking (9,458), Food Poisoning (8,654). Descriptor examples: Lead -> Lead Kit Request (Residential) (L10) (45,178); Air Quality -> Air: Odor/Fumes, Vehicle Idling (AD3) (19,364); Food Establishment -> Rodents/Insects/Garbage (12,417); Smoking -> Smoking Violation (9,299)
- **Typical agency:** DOHMH, DEP air programs, and cross-agency health enforcement.
- **Known DQ issue notes:** DOHMH completion and resolution timestamps can be less reliable for strict SLA benchmarking; treat median comparisons cautiously.
- **Under-reporting risk notes:** Health-risk complaints are sensitive to care access and awareness, producing uneven reporting intensity across income strata.
- **Current share (clean_311):** 171,337 requests (1.7397%).

## TRAFFIC_AND_SIGNALS
- **Short definition:** Traffic-flow and traffic-signal operation issues affecting intersection safety and congestion.
- **Mapped complaint types/descriptors:** Traffic Signal Condition (123,799), Traffic (20,115). Descriptor examples: Traffic Signal Condition -> Controller (56,361); Traffic Signal Condition -> Pedestrian Signal (12,895); Traffic Signal Condition -> Veh Signal Lamp (8,026); Traffic -> Congestion/Gridlock (7,730)
- **Typical agency:** DOT traffic operations and signal maintenance.
- **Known DQ issue notes:** Signal component descriptors are technical and can shift with controller hardware upgrades.
- **Under-reporting risk notes:** Residents without frequent digital access may report persistent signal issues less often.
- **Current share (clean_311):** 143,914 requests (1.4612%).

## CONSUMER_AND_VENDOR_REGULATION
- **Short definition:** Consumer protection, street-vendor compliance, posting violations, and regulated commerce complaints.
- **Mapped complaint types/descriptors:** Consumer Complaint (58,327), Vendor Enforcement (39,967), Outdoor Dining (17,652), Mobile Food Vendor (14,417), Illegal Posting (11,048), Posting Advertisement (327). Descriptor examples: Vendor Enforcement -> Food Vendor (26,561); Vendor Enforcement -> Non-Food Vendor (13,406); Illegal Posting -> Poster or Sign (9,725); Outdoor Dining -> Site Setup Condition (7,776)
- **Typical agency:** DCWP and interagency vendor enforcement teams.
- **Known DQ issue notes:** Complaint routing may change with policy cycles (e.g., outdoor dining rules), requiring periodic taxonomy review.
- **Under-reporting risk notes:** Small-business-heavy neighborhoods may under-report due to dependence on local merchant relationships.
- **Current share (clean_311):** 141,826 requests (1.4400%).

## PUBLIC_TRANSIT_AND_TAXI
- **Short definition:** Taxi/FHV rider issues, transit-adjacent infrastructure concerns, and rider property complaints.
- **Mapped complaint types/descriptors:** For Hire Vehicle Complaint (57,422), Lost Property (20,555), Taxi Complaint (20,483), Consumer Complaint (3,126), Taxi Report (2,245), For Hire Vehicle Report (1,249). Descriptor examples: For Hire Vehicle Complaint -> Driver Complaint - Non Passenger (50,160); Taxi Complaint -> Driver Complaint - Passenger (14,947); Lost Property -> Bag/Wallet (8,952); Lost Property -> Electronics/Phones (6,676)
- **Typical agency:** TLC operations with transit-support agencies as needed.
- **Known DQ issue notes:** Lost-property descriptors are consistent but not always linked to route metadata, limiting root-cause analysis.
- **Under-reporting risk notes:** Non-English-speaking riders may under-report FHV/taxi incidents due to channel friction.
- **Current share (clean_311):** 110,360 requests (1.1205%).

## PARKS_AND_RECREATION
- **Short definition:** Parks maintenance, park-rule enforcement, and recreation-space condition issues.
- **Mapped complaint types/descriptors:** Maintenance or Facility (64,928), Violation of Park Rules (12,579), Bike/Roller/Skate Chronic (11,831), Special Natural Area District (SNAD) (167), Lifeguard (88), Bench (39). Descriptor examples: Maintenance or Facility -> Structure - Outdoors (21,122); Maintenance or Facility -> Garbage or Litter (15,543); Maintenance or Facility -> Grass/Weeds (6,466); Maintenance or Facility -> Rodent Sighting (4,671)
- **Typical agency:** NYC Parks borough operations and enforcement staff.
- **Known DQ issue notes:** Maintenance descriptors span sanitation, facilities, and vegetation; category may overlap sanitation/tree operationally.
- **Under-reporting risk notes:** Park complaints are activity-dependent and may understate need in neighborhoods with lower park utilization.
- **Current share (clean_311):** 89,632 requests (0.9101%).

## EDUCATION_FACILITIES
- **Short definition:** School facility condition and maintenance complaints tied to educational sites.
- **Mapped complaint types/descriptors:** School Maintenance (4,359). Descriptor examples: School Maintenance -> Rodents/Mice (934); School Maintenance -> Air Conditioning Problem (805); School Maintenance -> Unclean Condition (763); School Maintenance -> Other School Condition (741)
- **Typical agency:** DOE facilities and custodial operations.
- **Known DQ issue notes:** School complaints are low-volume and can be seasonally concentrated around active school terms.
- **Under-reporting risk notes:** Reporting can vary with parent advocacy capacity and school-community engagement levels.
- **Current share (clean_311):** 4,359 requests (0.0443%).

## ENVIRONMENTAL_HAZARDS
- **Short definition:** Industrial contamination, hazardous discharge/spill, and environmental compliance incidents.
- **Mapped complaint types/descriptors:** Industrial Waste (2,454), Radioactive Material (50), Oil or Gas Spill (20), Sustainability Enforcement (1). Descriptor examples: Industrial Waste -> Grease In Sewer/Catch Basin (IDG) (585); Industrial Waste -> Wastewater Into Catch Basin (IEB) (544); Industrial Waste -> Concrete In Catch Basin (IEA) (481); Industrial Waste -> Odor In Sewer/Catch Basin (ICB) (220)
- **Typical agency:** DEP hazardous response and environmental enforcement units.
- **Known DQ issue notes:** Low-volume but high-severity signals; descriptor specificity is strong but case closure lag can be long.
- **Under-reporting risk notes:** Communities with limited environmental monitoring literacy may under-report chronic contamination indicators.
- **Current share (clean_311):** 2,525 requests (0.0256%).

## GOVERNMENT_SERVICES
- **Short definition:** Government oversight/referral, investigations, and administrative service complaints.
- **Mapped complaint types/descriptors:** Investigations and Discipline (IAD) (2,020), Borough Office (111), Dept of Investigations (109), Home Delivered Meal - Missed Delivery (26). Descriptor examples: Investigations and Discipline (IAD) -> Investigative Inspection (1,355); Investigations and Discipline (IAD) -> Plumbing Work - Unlicensed/Illegal/Improper Work In Progress (655); Borough Office -> Restroom Non-Complaince With Local Law 79/16 (109); Dept of Investigations -> Integrity Complaint Referral (109)
- **Typical agency:** DOI and related oversight offices.
- **Known DQ issue notes:** Very low-volume category; rates are sensitive to single-case swings and not suitable for broad trend extrapolation.
- **Under-reporting risk notes:** Civic complaint behavior for oversight issues is strongly mediated by legal awareness and trust in reporting channels.
- **Current share (clean_311):** 2,266 requests (0.0230%).

## OTHER
- **Short definition:** Intentional fallback for rare internal/test/system-coded records not analytically actionable for operational decisions.
- **Mapped complaint types/descriptors:** Incorrect Data (245), SNW (9), DSNY Internal (9), Internal Code (9), ZTESTINT (7), Executive Inspections (3), SRDE (1). Descriptor examples: Incorrect Data -> Collection Days (245); DSNY Internal -> Other Request for Enforcement (8); ZTESTINT -> ZTESTINT (6); Internal Code -> Noise: Other Noise Sources (Use Comments) - For Dep Internal Use Only (YNZZ) (4)
- **Typical agency:** Varies; often internal routing artifacts.
- **Known DQ issue notes:** Includes internal codes (e.g., SNW, ZTESTINT) and data-maintenance artifacts that should remain excluded from priority setting.
- **Under-reporting risk notes:** Not interpreted as resident demand; these records reflect system artifacts rather than neighborhood service access.
- **Current share (clean_311):** 283 requests (0.0029%).
