
import { fetchAnnotations } from '@/sanity/lib/utils';
import Anatomy from './Anatomy';
import Navigation from '../components/Navigation';

export default async function Page() {
  const annotations = await fetchAnnotations();

  return (
    <div>
      <Navigation/>
      <Anatomy content={{ annotations: annotations.data }} />
    </div>
  );
}
