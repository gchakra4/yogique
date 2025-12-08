import { ArrowLeft, BookOpen, CheckCircle, PenTool, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ArticleEditor from '../../dashboard/components/Modules/ArticleEditor';

type NewArticlePageProps = {
    article?: any;
    onSave?: (data: any) => Promise<void>;
    onCancel?: () => void;
    backToPath?: string;
    onBack?: () => void;
};

export default function NewArticlePage({ article, onSave, onCancel, backToPath = '/learning', onBack }: NewArticlePageProps) {
    const navigate = useNavigate();

    const handleSave = async (data: any): Promise<void> => {
        if (onSave) {
            await onSave(data);
        } else {
            // Replace with real save flow if needed; this keeps contract Promise<void>
            console.log('Article saved:', data);
            navigate(backToPath);
        }
    };

    const handleCancel = (): void => {
        if (onCancel) {
            onCancel();
        } else {
            navigate(backToPath);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
            {/* Top Bar / Breadcrumb */}
            <div className="border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        {onBack ? (
                            <button
                                type="button"
                                onClick={onBack}
                                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </button>
                        ) : (
                            <Link
                                to={backToPath}
                                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Learning
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Hero */}
            <div className="bg-white dark:bg-slate-900">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                            <PenTool className="w-4 h-4 mr-1" />
                            Article Creator
                        </span>
                    </div>
                    <h1 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                        Write a New Article
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-slate-300">
                        Share your yoga wisdom with the community. Save as draft, submit for review, or publish when ready.
                    </p>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Editor */}
                    <div className="lg:col-span-3">
                        <div className="bg-transparent dark:bg-transparent rounded-none sm:bg-white sm:dark:bg-slate-900 sm:rounded-xl sm:shadow-sm -mx-4 sm:mx-0">
                            <ArticleEditor article={article} onSave={handleSave} onCancel={handleCancel} />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-none sm:rounded-xl border-0 sm:border sm:border-gray-200 sm:dark:border-slate-700 shadow-none sm:shadow-sm p-4 sm:p-6 -mx-4 sm:mx-0">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Tips for a great article
                                </h3>
                            </div>
                            <ul className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                                    Keep the title under 60 characters and make it descriptive.
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                                    Use Preview Text to summarize what readers will learn.
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                                    Add an engaging cover image and relevant tags for discovery.
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                                    Structure content with headings, lists, and short paragraphs.
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-none sm:rounded-xl border-0 sm:border sm:border-blue-100 sm:dark:border-slate-700 p-4 sm:p-6 -mx-4 sm:mx-0">
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Publishing flow
                                </h3>
                            </div>
                            <ol className="space-y-2 text-sm text-gray-700 dark:text-slate-300 list-decimal list-inside">
                                <li>Save Draft to keep working.</li>
                                <li>Submit for Review to send to a moderator.</li>
                                <li>Publish (if allowed) or auto-publish after approval.</li>
                            </ol>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
