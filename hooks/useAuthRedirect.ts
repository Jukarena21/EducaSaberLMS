import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuthRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (session?.user?.role) {
      switch (session.user.role) {
        case "student":
          router.push("/estudiante")
          break
        case "school_admin":
        case "teacher_admin":
          router.push("/admin")
          break
        default:
          router.push("/")
      }
    }
  }, [session, status, router])

  return { session, status }
} 