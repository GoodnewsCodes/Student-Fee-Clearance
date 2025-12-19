export interface Department {
  id: string;
  name: string;
  faculty: string;
}

export const departments: Department[] = [
  { id: "1", name: "Computer Science", faculty: "Science" },
  { id: "2", name: "Mass Communication", faculty: "Social Sciences" },
  { id: "3", name: "Accountancy", faculty: "Management Sciences" },
  { id: "4", name: "Business Administration", faculty: "Management Sciences" },
  { id: "5", name: "Economics", faculty: "Social Sciences" },
  { id: "6", name: "Software Engineering", faculty: "Science" },
];

export const departmentUnits = [
  {
    value: "mathematics_computer_science",
    label: "Mathematics & Computer Science",
  },
  { value: "law", label: "Law" },
  {
    value: "criminology_security_studies",
    label: "Criminology & Security Studies",
  },
  { value: "geology", label: "Geology" },
  {
    value: "journalism_mass_communication",
    label: "Journalism & Mass Communication",
  },
  { value: "nursing_science", label: "Nursing Science" },
  { value: "optometry", label: "Optometry" },
  { value: "accounting", label: "Accounting" },
  { value: "political_science", label: "Political Science" },
  { value: "business_administration", label: "Business Administration" },
  { value: "public_administration", label: "Public Administration" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "public_health", label: "Public Health" },
  { value: "applied_geophysics", label: "Applied Geophysics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
  { value: "biochemistry", label: "Biochemistry" },
  { value: "biotechnology", label: "Biotechnology" },
  { value: "human_physiology", label: "Human Physiology" },
  { value: "radiology", label: "Radiology" },
  { value: "human_anatomy", label: "Human Anatomy" },
  { value: "microbiology", label: "Microbiology" },
  { value: "peace_conflict_studies", label: "Peace & Conflict Studies" },
  { value: "economics", label: "Economics" },
  {
    value: "hospitality_tourism_management",
    label: "Hospitality & Tourism Management",
  },
  { value: "sociology", label: "Sociology" },
  { value: "english", label: "English" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "software_engineering", label: "Software Engineering" },
  { value: "data_science", label: "Data Science" },
];
