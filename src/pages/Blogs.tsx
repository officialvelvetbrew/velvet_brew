import React, { useState } from 'react';
import Header from '../components/Header';
import { COLORS } from '../data/colors';
import { useNavigate } from 'react-router-dom';

const BLOGS_DATA = [
  {
    id: 1,
    title: 'The Art of Brewing',
    summary: 'Discover the secrets behind a perfect cup of coffee.',
    content: 'Brewing coffee is an art that requires the right beans, water temperature, and equipment. In this blog, we explore how different brewing methods affect the taste of your coffee...',
    date: '2026-09-10',
    image: '/napblog.jpeg'
  },
  {
    id: 2,
    title: 'Coffee and Health',
    summary: 'Is coffee actually good for you?',
    content: 'Coffee is rich in antioxidants and has been linked to various health benefits, including improved brain function and a lower risk of certain diseases...',
    date: '2026-09-08',
    image: '/napblog.jpeg'
  }
];

export default function Blogs() {
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.espresso, fontFamily: "'Jost', sans-serif" }}>
      <Header cartCount={0} onOpenCart={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-white">
        <h1 className="text-4xl mb-8 vb-display" style={{ color: COLORS.gold }}>Our Blogs</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOGS_DATA.map((blog) => (
            <div 
              key={blog.id} 
              className="rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => setSelectedBlog(blog)}
            >
              <img src={blog.image} alt={blog.title} className="w-full h-48 object-cover" />
              <div className="p-5">
                <p className="text-xs mb-2" style={{ color: COLORS.gold }}>{blog.date}</p>
                <h2 className="text-xl font-semibold mb-2" style={{ color: COLORS.cream }}>{blog.title}</h2>
                <p className="text-sm" style={{ color: COLORS.muted }}>{blog.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBlog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedBlog(null)}>
          <div 
            className="max-w-3xl w-full rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: COLORS.espresso, border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img src={selectedBlog.image} alt={selectedBlog.title} className="w-full h-64 object-cover" />
              <button 
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/80"
                onClick={() => setSelectedBlog(null)}
              >
                ?
              </button>
            </div>
            <div className="p-8 text-white">
              <p className="text-sm mb-2" style={{ color: COLORS.gold }}>{selectedBlog.date}</p>
              <h2 className="text-3xl font-bold mb-6 vb-display" style={{ color: COLORS.cream }}>{selectedBlog.title}</h2>
              <div className="prose prose-invert max-w-none text-base leading-relaxed" style={{ color: 'rgba(253,251,247,0.9)' }}>
                {selectedBlog.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
