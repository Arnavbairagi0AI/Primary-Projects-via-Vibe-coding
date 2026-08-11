import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { motion } from "motion/react";
import { 
  Star, 
  Sparkles, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Plus, 
  MessageSquare,
  RefreshCw,
  Clock,
  User
} from "lucide-react";
import { Review } from "../types";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export const ReviewHub: React.FC = () => {
  const { 
    user, 
    reviews, 
    reviewsLoading, 
    generateReviewReply, 
    updateReviewReplyText, 
    postReviewReply,
    addMockSampleReviews 
  } = useApp();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<"All" | "Positive" | "Neutral" | "Negative">("All");
  
  // Custom review modal / inline creator state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReviewer, setNewReviewer] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState("");
  const [addingReview, setAddingReview] = useState(false);

  // Filter logic
  const filteredReviews = reviews.filter((r) => {
    const matchesSearch = 
      r.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reviewText.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (ratingFilter === "All") return matchesSearch;
    if (ratingFilter === "Positive") return matchesSearch && r.rating >= 4;
    if (ratingFilter === "Neutral") return matchesSearch && r.rating === 3;
    if (ratingFilter === "Negative") return matchesSearch && r.rating <= 2;
    return matchesSearch;
  });

  // Calculate Metrics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1) 
    : "0.0";
  const pendingReplies = reviews.filter(r => r.aiReplyStatus !== "Posted").length;

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newReviewer.trim() || !newText.trim()) return;

    setAddingReview(true);
    try {
      const reviewsRef = collection(db, "reviews");
      await addDoc(reviewsRef, {
        userId: user.uid,
        reviewerName: newReviewer,
        rating: newRating,
        reviewText: newText,
        timestamp: new Date().toISOString(),
        aiReplyStatus: "Pending",
        generatedReplyText: ""
      });

      // Reset
      setNewReviewer("");
      setNewRating(5);
      setNewText("");
      setShowAddModal(false);
    } catch (e) {
      console.error("Error adding review:", e);
    } finally {
      setAddingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add review button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Review Hub</h1>
          <p className="text-sm text-slate-400">Monitor Google Business reviews and generate AI smart replies instantly.</p>
        </div>
        <div className="flex items-center gap-2">
          {reviews.length === 0 && (
            <button
              id="add-mock-reviews-btn"
              onClick={addMockSampleReviews}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#131a26] border border-slate-800 text-sm font-semibold rounded-lg text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Demo Reviews
            </button>
          )}
          <button
            id="open-add-review-modal"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 rounded-lg shadow-lg shadow-indigo-500/15 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Test Review
          </button>
        </div>
      </div>

      {/* Metrics Card Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Reviews */}
        <div id="metric-total-reviews" className="bg-[#0e131f] p-5 rounded-2xl border border-slate-800/80 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reviews</span>
            <p className="text-3xl font-extrabold text-white">{totalReviews}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>

        {/* Average Rating */}
        <div id="metric-avg-rating" className="bg-[#0e131f] p-5 rounded-2xl border border-slate-800/80 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Rating</span>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-extrabold text-white">{averageRating}</p>
              <div className="flex items-center text-amber-400">
                <Star className="h-5 w-5 fill-current" />
              </div>
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Star className="h-6 w-6 fill-current" />
          </div>
        </div>

        {/* Pending Replies */}
        <div id="metric-pending-replies" className="bg-[#0e131f] p-5 rounded-2xl border border-slate-800/80 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Action</span>
            <p className="text-3xl font-extrabold text-white">{pendingReplies}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search Controls */}
      <div className="bg-[#0e131f] p-4 rounded-xl border border-slate-800/80 shadow-md flex flex-col md:flex-row items-center gap-4 justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            id="search-input"
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-[#131a26] border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Rating filters */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1 shrink-0">
            <Filter className="h-3 w-3" /> Filter:
          </span>
          {(["All", "Positive", "Neutral", "Negative"] as const).map((filter) => (
            <button
              key={filter}
              id={`filter-btn-${filter.toLowerCase()}`}
              onClick={() => setRatingFilter(filter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg focus:outline-none transition-all duration-200 cursor-pointer ${
                ratingFilter === filter
                  ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/10"
                  : "bg-[#131a26] border border-slate-800/80 text-slate-300 hover:bg-[#1a2333]"
              }`}
            >
              {filter === "Positive" && "4+ Stars"}
              {filter === "Neutral" && "3 Stars"}
              {filter === "Negative" && "1-2 Stars"}
              {filter === "All" && "All Reviews"}
            </button>
          ))}
        </div>
      </div>

      {/* Add Review Inline Modal/Form */}
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0e131f] p-5 rounded-2xl border border-slate-800/80 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white">Add a Mock Customer Review</h3>
            <button 
              id="close-add-modal"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleAddReview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Customer Name *
                </label>
                <input
                  id="new-reviewer-name"
                  type="text"
                  required
                  value={newReviewer}
                  onChange={(e) => setNewReviewer(e.target.value)}
                  placeholder="e.g. Rahul Sen"
                  className="block w-full px-3 py-2 bg-[#131a26] border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Rating *
                </label>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      id={`star-select-${star}`}
                      onClick={() => setNewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star 
                        className={`h-6 w-6 ${
                          star <= newRating 
                            ? "fill-amber-400 text-amber-400" 
                            : "text-slate-700"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Review Text *
              </label>
              <textarea
                id="new-review-text"
                required
                rows={3}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Write what the customer says about your business..."
                className="block w-full px-3 py-2 bg-[#131a26] border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>

            <button
              id="submit-new-review"
              type="submit"
              disabled={addingReview}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 rounded-lg shadow-lg shadow-indigo-500/15 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {addingReview ? "Saving..." : "Add to Review Feed"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Review Feed Table */}
      <div className="space-y-4">
        {reviewsLoading ? (
          <div className="bg-[#0e131f] py-12 flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 shadow-lg text-slate-400">
            <svg className="animate-spin h-8 w-8 text-indigo-500 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm font-semibold">Synchronizing with live Google Reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-[#0e131f] py-12 flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 shadow-lg text-center px-4">
            <MessageSquare className="h-10 w-10 text-slate-600 mb-2" />
            <h3 className="font-semibold text-white">No Reviews Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Adjust your search filters or add a test review to see how ReviewMagnet AI automates responses!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const isNegative = review.rating <= 3;
              return (
                <motion.div
                  key={review.id}
                  id={`review-item-${review.id}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-2xl border transition-all duration-200 ${
                    isNegative 
                      ? "bg-rose-500/5 border-rose-500/30 shadow-md shadow-rose-950/5" 
                      : "bg-[#0e131f] border-slate-800/80 shadow-lg hover:border-slate-700/80"
                  }`}
                >
                  {/* Top line info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-slate-800/80 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#131a26] flex items-center justify-center text-indigo-400 font-bold text-xs border border-slate-800">
                        {review.reviewerName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          {review.reviewerName}
                          {isNegative && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertCircle className="h-3 w-3" /> Context Alert
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(review.timestamp).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`h-4 w-4 ${
                            s <= review.rating 
                              ? "fill-amber-400 text-amber-400" 
                              : "text-slate-700"
                          }`} 
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Text Body */}
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    "{review.reviewText}"
                  </p>

                  {/* AI Response Block */}
                  <div className="mt-4 p-4 rounded-xl bg-[#131a26]/60 border border-slate-800/80">
                    {review.aiReplyStatus === "Pending" ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Sparkles className="h-4 w-4 text-indigo-400" />
                          <span className="text-xs font-semibold">AI Assistant ready</span>
                        </div>
                        <button
                          id={`gen-btn-${review.id}`}
                          onClick={() => generateReviewReply(review.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 rounded-lg shadow-md shadow-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Generate Smart AI Reply
                        </button>
                      </div>
                    ) : review.aiReplyStatus === "Generated" ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs font-bold text-indigo-400">
                            <Sparkles className="h-4 w-4" />
                            <span>Drafting Reply with Gemini API</span>
                          </div>
                          <button
                            id={`regen-btn-${review.id}`}
                            onClick={() => generateReviewReply(review.id)}
                            className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 focus:outline-none hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="h-3 w-3" /> Regenerate
                          </button>
                        </div>

                        {/* Editable reply box */}
                        <textarea
                          id={`reply-textarea-${review.id}`}
                          rows={3}
                          value={review.generatedReplyText}
                          onChange={(e) => updateReviewReplyText(review.id, e.target.value)}
                          className="block w-full p-2.5 bg-[#0e131f] border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs leading-relaxed"
                        />

                        {/* Confirm / Save action */}
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            id={`post-btn-${review.id}`}
                            onClick={() => postReviewReply(review.id, review.generatedReplyText)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 rounded-lg shadow-md shadow-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all cursor-pointer"
                          >
                            <Send className="h-3 w-3" />
                            Confirm & Post
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Posted status */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Posted to Google Business</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">Auto-published</span>
                        </div>
                        <p className="text-xs text-slate-300 italic bg-[#0b0f19] p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                          "{review.generatedReplyText}"
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
