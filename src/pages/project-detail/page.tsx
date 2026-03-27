import { Navigate, useParams } from "react-router-dom";

export default function ProjectDetailPage() {
  const { id } = useParams();

  if (!id) {
    return <Navigate to="/manager/projects" replace />;
  }

  return <Navigate to={`/manager/projects/${id}/edit`} replace />;
}
