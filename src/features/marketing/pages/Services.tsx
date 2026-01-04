import { Navigate } from 'react-router-dom'

// Services page retired — redirect to YogaForYou
export default function Services() {
  return <Navigate to="/book/private-group" replace />
}