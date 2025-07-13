export interface Department {
  id: string
  name: string
  faculty: string
}

export const departments: Department[] = [
  { id: "1", name: "Computer Science", faculty: "Science" },
  { id: "2", name: "Mass Communication", faculty: "Social Sciences" },
  { id: "3", name: "Accountancy", faculty: "Management Sciences" },
  { id: "4", name: "Business Administration", faculty: "Management Sciences" },
  { id: "5", name: "Economics", faculty: "Social Sciences" },
  { id: "6", name: "Software Engineering", faculty: "Science" },
]
