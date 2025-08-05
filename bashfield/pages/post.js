import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

export default function PostListing() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!session) {
    return <p>Please sign in with Gmail to post a listing.</p>;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await supabase.from('listings').insert([
      {
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
        city: formData.city,
        user_id: session.user.id,
      },
    ]);

    if (error) {
      console.error('Supabase Insert Error:', error);
      setErrorMessage('Error submitting listing. Please try again.');
    } else {
      router.push('/');
    }

    setLoading(false);
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl mb-4">Post a New Listing</h1>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Title"
          required
          className="w-full border p-2"
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description"
          required
          className="w-full border p-2"
        />
        <input
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          placeholder="Price"
          required
          className="w-full border p-2"
        />
        <input
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="City"
          required
          className="w-full border p-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Submitting...' : 'Submit Listing'}
        </button>
      </form>
    </div>
  );
}
