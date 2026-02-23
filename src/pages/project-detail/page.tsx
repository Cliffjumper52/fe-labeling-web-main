
import { useParams } from "react-router";

export default function ProjectDetail() {
  const { id } = useParams();

  return <div className="h-[120vh]">ProjectDetail: {id}</div>;
}
