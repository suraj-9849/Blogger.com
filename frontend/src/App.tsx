import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Signin from './pages/Signin';
import Blog from './pages/Blog';
import Blogs from './pages/Blogs';
import Publish from './pages/Publish';
import Trending from './pages/Trending';
import { Bookmarks } from './pages/Bookmarks';
import Profile from './pages/Profile';
import MyStories from './pages/MyStories';
import { Layout } from './components/Layout';

function App() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blog/:id" element={<Blog isAuthenticated={isAuthenticated} />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/bookmarks" element={<Layout><Bookmarks /></Layout>} />
        <Route path="/mystories" element={<MyStories isAuthenticated={isAuthenticated} user={user} />} />
        <Route path="/profile" element={<Profile isAuthenticated={isAuthenticated} user={user} />} />
        <Route path="/publish" element={<Publish isAuthenticated={isAuthenticated} user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;