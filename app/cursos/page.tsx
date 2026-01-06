import { redirect } from "next/navigation"

export default function CursosPage() {
  // Redirige a la landing principal y abre la pestaña de cursos
  redirect("/?redirectedFrom=/cursos")
}


