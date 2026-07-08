import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, CheckCircle, Upload, FileText, ArrowLeft, Trash2, HelpCircle, Loader2, Play } from 'lucide-react';
import { fetchCustomBooks, createCustomBook, deleteCustomBook, getUserData } from '../services/db';
import { initialWords } from '../data/words';

// Common stop words to exclude from raw English word extraction
const STOP_WORDS = new Set([
  'the', 'and', 'to', 'of', 'a', 'in', 'is', 'that', 'it', 'on', 'you', 'he', 'was', 'for', 'are', 'as', 'with', 'his', 'they', 'i', 'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we', 'when', 'your', 'can', 'said', 'there', 'use', 'an', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'him', 'into', 'time', 'has', 'look', 'two', 'more', 'write', 'go', 'see', 'number', 'no', 'way', 'could', 'people', 'my', 'than', 'first', 'water', 'been', 'called', 'who', 'am', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part', 'new', 'some', 'take', 'only', 'me', 'our', 'under', 'very', 'through', 'just', 'great', 'say', 'help', 'low', 'line', 'before', 'turn', 'cause', 'same', 'mean', 'differ', 'move', 'right', 'boy', 'old', 'too', 'same', 'tell', 'does', 'set', 'three', 'want', 'well', 'also', 'play', 'small', 'end', 'put', 'home', 'read', 'hand', 'port', 'large', 'spell', 'add', 'even', 'land', 'here', 'must', 'big', 'high', 'such', 'follow', 'act', 'why', 'ask', 'men', 'change', 'went', 'light', 'kind', 'off', 'need', 'house', 'picture', 'try', 'us', 'again', 'animal', 'point', 'mother', 'world', 'near', 'build', 'self', 'earth', 'father', 'head', 'stand', 'own', 'page', 'should', 'country', 'found', 'answer', 'school', 'grow', 'study', 'still', 'learn', 'plant', 'cover', 'food', 'sun', 'four', 'between', 'state', 'keep', 'eye', 'never', 'last', 'let', 'thought', 'city', 'tree', 'cross', 'farm', 'hard', 'start', 'might', 'story', 'saw', 'far', 'sea', 'draw', 'left', 'late', 'run', 'don\'t', 'while', 'press', 'close', 'night', 'real', 'life', 'few', 'north', 'open', 'seem', 'together', 'next', 'white', 'children', 'begin', 'got', 'walk', 'example', 'ease', 'paper', 'group', 'always', 'music', 'those', 'both', 'mark', 'often', 'letter', 'until', 'mile', 'river', 'car', 'feet', 'care', 'second', 'book', 'carry', 'took', 'science', 'eat', 'room', 'friend', 'began', 'idea', 'fish', 'mountain', 'stop', 'once', 'base', 'hear', 'horse', 'cut', 'sure', 'watch', 'color', 'face', 'wood', 'main', 'enough', 'plain', 'girl', 'usual', 'young', 'ready', 'above', 'ever', 'red', 'list', 'though', 'feel', 'talk', 'bird', 'soon', 'body', 'dog', 'family', 'direct', 'pose', 'leave', 'song', 'measure', 'state', 'product', 'black', 'short', 'num', 'class', 'wind', 'question', 'happen', 'complete', 'ship', 'area', 'half', 'rock', 'order', 'fire', 'south', 'problem', 'piece', 'told', 'knew', 'pass', 'since', 'top', 'whole', 'king', 'space', 'heard', 'best', 'hour', 'better', 'true'
]);

interface CustomBook {
  id: string;
  title: string;
  desc: string;
  wordCount: number;
}

export function LibraryTab({ 
  userId, 
  currentBook, 
  onChangeBook 
}: { 
  userId: string; 
  currentBook: string; 
  onChangeBook: (book: string) => void; 
}) {
  const [customBooks, setCustomBooks] = useState<CustomBook[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  
  // Import states
  const [importStep, setImportStep] = useState<'list' | 'upload' | 'preview' | 'processing' | 'success'>('list');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pdfProgress, setPdfProgress] = useState(0);
  
  // Book Metadata
  const [bookTitle, setBookTitle] = useState('');
  const [bookDesc, setBookDesc] = useState('');
  
  // Words parsed
  const [allExtractedWords, setAllExtractedWords] = useState<string[]>([]);
  const [selectedWordMap, setSelectedWordMap] = useState<Record<string, boolean>>({});
  const [wasSliced, setWasSliced] = useState(false);
  const [originalCount, setOriginalCount] = useState(0);
  
  // Cooldown status
  const [lastUploadAt, setLastUploadAt] = useState<number | null>(null);
  const [cooldownText, setCooldownText] = useState<string | null>(null);
  
  // Delete confirmation state
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  
  // Final enrichment progress
  const [importProgress, setImportProgress] = useState(0);
  const [currentProcessingWord, setCurrentProcessingWord] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom books and cooldown info on mount
  useEffect(() => {
    const loadBooksAndCooldown = async () => {
      if (!userId) return;
      setLoadingBooks(true);
      try {
        const [books, userData] = await Promise.all([
          fetchCustomBooks(userId),
          getUserData(userId)
        ]);
        setCustomBooks(books);
        if (userData?.lastUploadAt) {
          setLastUploadAt(userData.lastUploadAt);
        }
      } catch (err) {
        console.error('Failed to load user book data/cooldown:', err);
      } finally {
        setLoadingBooks(false);
      }
    };
    loadBooksAndCooldown();
  }, [userId]);

  // Handle dynamic countdown updates
  useEffect(() => {
    if (!lastUploadAt) {
      setCooldownText(null);
      return;
    }

    const checkCooldown = () => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const elapsed = now - lastUploadAt;
      if (elapsed < oneDay) {
        const remainingTime = oneDay - elapsed;
        const hours = Math.floor(remainingTime / (60 * 60 * 1000));
        const minutes = Math.ceil((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
        setCooldownText(`还需等待 ${hours} 小时 ${minutes} 分钟`);
      } else {
        setCooldownText(null);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [lastUploadAt]);

  // Dynamically load PDF.js from Cloudflare CDN
  const loadPdfJS = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        resolve(pdfjs);
      };
      script.onerror = () => reject(new Error('Failed to load PDF parsing engine from CDN.'));
      document.head.appendChild(script);
    });
  };

  // Extract raw text from the selected PDF
  const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjs = await loadPdfJS();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    const numPages = pdf.numPages;
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
      setPdfProgress(Math.round((i / numPages) * 100));
    }
    return fullText;
  };

  // Extract raw text from the selected TXT
  const extractTextFromTxt = (fileToRead: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.onerror = () => reject(new Error('读取 TXT 文件失败'));
      reader.readAsText(fileToRead, 'utf-8');
    });
  };

  // Parse, filter, and extract core vocab list
  const processUploadedFile = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setImportStep('processing');
    setPdfProgress(0);
    
    const isTxt = selectedFile.name.toLowerCase().endsWith('.txt') || selectedFile.type === 'text/plain';
    setCurrentProcessingWord(isTxt ? '正在读取 TXT 文本...' : '正在读取 PDF 文本...');
    
    try {
      let fullText = '';
      if (isTxt) {
        fullText = await extractTextFromTxt(selectedFile);
        setPdfProgress(100);
      } else {
        fullText = await extractTextFromPdf(selectedFile);
      }
      
      setCurrentProcessingWord('正在分析并精筛词汇...');
      
      // Tokenize using regex (words between 3 and 18 chars)
      const matches = fullText.match(/\b[a-zA-Z]{3,18}\b/g) || [];
      
      // Deduplicate and filter using STOP_WORDS
      const filtered = Array.from(new Set(matches.map(w => w.toLowerCase())))
        .filter(w => !STOP_WORDS.has(w) && /^[a-z]+$/.test(w));
      
      if (filtered.length === 0) {
        throw new Error(isTxt ? '未在 TXT 中检测到足够的英文单词。请上传包含英文词汇的文档。' : '未在 PDF 中检测到足够的英文单词。请上传包含英文词汇的书籍或文档。');
      }

      const totalFound = filtered.length;
      setOriginalCount(totalFound);
      
      let finalWords = filtered;
      if (totalFound > 5000) {
        finalWords = filtered.slice(0, 5000);
        setWasSliced(true);
      } else {
        setWasSliced(false);
      }

      // Extract words from the document (capped at 5000 to protect Firestore performance)
      setAllExtractedWords(finalWords);
      
      // Initialize map (select all by default)
      const map: Record<string, boolean> = {};
      finalWords.forEach(w => { map[w] = true; });
      setSelectedWordMap(map);
      
      // Set default book details
      const rawName = selectedFile.name.replace(/\.[^/.]+$/, "");
      setBookTitle(rawName.substring(0, 15));
      setBookDesc(isTxt ? `从 TXT《${rawName.substring(0, 20)}》智能导入` : `从 PDF《${rawName.substring(0, 20)}》智能导入`);
      
      setImportStep('preview');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '文件解析失败，请确保该文件具有可读取的文本。');
      setImportStep('upload');
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Drag Leave Handler
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Drag Drop Handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const isPdf = droppedFile.type === 'application/pdf' || droppedFile.name.toLowerCase().endsWith('.pdf');
      const isTxt = droppedFile.type === 'text/plain' || droppedFile.name.toLowerCase().endsWith('.txt');
      if (isPdf || isTxt) {
        processUploadedFile(droppedFile);
      } else {
        alert('请上传标准的 PDF 或 TXT 格式文件！');
      }
    }
  };

  // File Select Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processUploadedFile(selectedFile);
    }
  };

  // Confirm and enrich the selected vocabulary with local dictionaries + Gemini API
  const handleConfirmImport = async () => {
    const wordsToImport = allExtractedWords.filter(w => selectedWordMap[w]);
    if (wordsToImport.length === 0) {
      alert('请至少勾选一个单词进行导入！');
      return;
    }

    try {
      // Check 24-hour upload limit
      const userData = await getUserData(userId);
      const lastUpload = userData?.lastUploadAt;
      if (lastUpload) {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (now - lastUpload < oneDay) {
          const remainingTime = oneDay - (now - lastUpload);
          const hours = Math.floor(remainingTime / (60 * 60 * 1000));
          const minutes = Math.ceil((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
          alert(`由于云端配额限制，每日限导入 1 次自定义词书。请在 ${hours} 小时 ${minutes} 分钟后再试，或直接学习已有词书。`);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to verify upload limit:', err);
    }
    
    setImportStep('processing');
    setImportProgress(0);
    setCurrentProcessingWord('正在匹配本地词典库...');

    const enrichedList: any[] = [];
    const queueToLookup: string[] = [];

    // Step 1: Query local static dictionary first (cet4 & cet6 catalogs)
    wordsToImport.forEach(word => {
      const match = initialWords.find(w => w.english.toLowerCase() === word);
      if (match) {
        enrichedList.push({
          english: match.english,
          phonetic: match.phonetic || '/unknown/',
          definition: match.definition || 'n. 暂无释义',
          exampleEn: match.exampleEn || 'No example sentence.',
          exampleZh: match.exampleZh || '暂无例句翻译。',
          isPending: false
        });
      } else {
        queueToLookup.push(word);
      }
    });

    // Update progress after local matches are resolved
    let currentCount = enrichedList.length;
    setImportProgress(Math.round((currentCount / wordsToImport.length) * 100));

    // Step 2: For any remaining custom words, mark them as pending AI enrichment.
    // They will be dynamically lookup-enriched (lazy-loaded) when studied or reviewed.
    // This allows importing books of any size (e.g. 2000+ words) instantly and stably.
    if (queueToLookup.length > 0) {
      setCurrentProcessingWord(`正在极速初始化 ${queueToLookup.length} 个自定义词汇...`);
      queueToLookup.forEach(w => {
        enrichedList.push({
          english: w,
          phonetic: '/pending/',
          definition: '等待 AI 智能生成释义...',
          exampleEn: '',
          exampleZh: '',
          isPending: true
        });
      });
      setImportProgress(100);
    }

    // Step 3: Write custom book and words to Firestore
    try {
      setCurrentProcessingWord('正在保存到云端森林数据库...');
      await createCustomBook(userId, bookTitle, bookDesc, enrichedList);
      
      // Update local cooldown state
      setLastUploadAt(Date.now());
      
      // Reload custom books
      const updatedBooks = await fetchCustomBooks(userId);
      setCustomBooks(updatedBooks);
      setImportStep('success');
    } catch (err) {
      console.error('Firestore save failed:', err);
      alert('保存词书失败，请检查网络连接！');
      setImportStep('preview');
    }
  };

  // Delete a custom book
  const handleDeleteBook = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    setBookToDelete(bookId);
  };

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;
    const bookId = bookToDelete;
    
    // If we delete the current selected book, switch back to CET6 first
    if (currentBook === bookId) {
      onChangeBook('CET6');
    }

    // Optimistic state update
    setCustomBooks(prev => prev.filter(b => b.id !== bookId));
    setBookToDelete(null);
    await deleteCustomBook(userId, bookId);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="relative flex flex-col h-full px-6 py-4"
    >
      <AnimatePresence mode="wait">
        {/* Step 1: Custom Books List */}
        {importStep === 'list' && (
          <motion.div 
            key="list" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">词书更换</h2>
              <button 
                onClick={() => setImportStep('upload')}
                className="text-xs bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md shadow-teal-500/10 active:scale-95 transition-all flex items-center space-x-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>导入 PDF/TXT</span>
              </button>
            </div>
            
            <div className="space-y-4 overflow-y-auto pb-24 hide-scrollbar">
              {/* Preloaded books */}
              <BookCard 
                title="六级核心词汇" 
                desc="CET6 必备单词" 
                isCurrent={currentBook === 'CET6'} 
                onClick={() => onChangeBook('CET6')}
              />
              <BookCard 
                title="四级核心词汇" 
                desc="CET4 必备单词" 
                isCurrent={currentBook === 'CET4'} 
                onClick={() => onChangeBook('CET4')}
              />

              {/* Custom books Divider */}
              {customBooks.length > 0 && (
                <div className="pt-2 pb-1">
                  <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">我的自定义词书</span>
                </div>
              )}

              {loadingBooks ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                </div>
              ) : (
                customBooks.map(book => (
                  <BookCard 
                    key={book.id}
                    title={book.title} 
                    desc={`${book.desc} (共 ${book.wordCount} 词)`} 
                    isCurrent={currentBook === book.id} 
                    onClick={() => onChangeBook(book.id)}
                    onDelete={(e) => handleDeleteBook(e, book.id)}
                  />
                ))
              )}

              {/* Dash Border Upload Entry Card */}
              <div 
                onClick={() => setImportStep('upload')}
                className="p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-500 bg-white/20 hover:bg-white/40 cursor-pointer flex flex-col items-center justify-center space-y-2 transition-all duration-300 py-8"
              >
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm font-semibold text-slate-600">添加您自己的 PDF 或 TXT 单词本</span>
                <span className="text-xs text-slate-400">一键提取生词，AI 极速配音补全</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Upload File Box */}
        {importStep === 'upload' && (
          <motion.div 
            key="upload" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            <div className="flex items-center space-x-2 mb-6">
              <button 
                onClick={() => { setImportStep('list'); setErrorMsg(''); }}
                className="p-2 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 active:scale-95 transition-all text-slate-600"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">导入 PDF/TXT 词书</h2>
            </div>

            {errorMsg && (
              <div className="p-4 mb-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm leading-relaxed">
                {errorMsg}
              </div>
            )}

            {cooldownText && (
              <div className="bg-amber-50 border border-amber-200/60 text-amber-800 text-xs rounded-xl p-3.5 mb-4 leading-relaxed flex items-start gap-2 shadow-sm">
                <span className="text-sm">⚠️</span>
                <div>
                  <span className="font-bold">每日导入额度已用完</span>：由于云端免费资源限制，每日限导入 1 次自定义词书。请在 <b>{cooldownText}</b> 后再次上传。
                </div>
              </div>
            )}

            <div 
              onDragOver={cooldownText ? undefined : handleDragOver}
              onDragLeave={cooldownText ? undefined : handleDragLeave}
              onDrop={cooldownText ? undefined : handleDrop}
              onClick={cooldownText ? undefined : () => fileInputRef.current?.click()}
              className={`flex-1 min-h-[250px] border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                cooldownText 
                  ? 'border-slate-200 bg-slate-50/50 cursor-not-allowed opacity-80' 
                  : isDragging 
                    ? 'border-teal-500 bg-teal-50/30 scale-[0.98]' 
                    : 'border-slate-300 bg-white/40 hover:bg-white/60 cursor-pointer'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="application/pdf, text/plain"
                className="hidden" 
                disabled={!!cooldownText}
              />
              
              <div className={`p-5 rounded-2xl bg-white/80 shadow-md shadow-slate-100/50 mb-4 ${cooldownText ? 'text-slate-400' : 'text-teal-600'}`}>
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {cooldownText ? '导入功能冷却中' : '拖拽 PDF / TXT 文件到此处'}
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-xs leading-relaxed">
                {cooldownText 
                  ? `您今日已成功导入，请在 ${cooldownText} 后再次添加。` 
                  : '或点击此处选择您的 PDF 书籍或 TXT 单词本 (建议 20MB 以内)'}
              </p>
              
              <div className={`${cooldownText ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-teal-50 text-teal-600 border-teal-100'} text-xs font-semibold px-4 py-2 rounded-full border flex items-center space-x-1.5`}>
                <span>{cooldownText ? `冷却中：${cooldownText}` : '支持标准文本 PDF 与 UTF-8 编码的 TXT 文件'}</span>
              </div>
            </div>

            <div className="mt-4 text-[11px] text-slate-400 leading-relaxed space-y-1.5 px-2 mb-12">
              <div className="flex items-start gap-1.5">
                <span className="text-amber-500">✦</span>
                <span><b>导入额度</b>：每日可导入 1 次，单本词书上限 5000 词（超出将自动截断保留高频词）。</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-teal-500">✦</span>
                <span><b>自动解析</b>：系统提取词干并排除 a, standard 等停用词，匹配标准音标与中文释义。</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Preview and Select Words */}
        {importStep === 'preview' && (
          <motion.div 
            key="preview" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            <div className="flex items-center space-x-2 mb-4">
              <button 
                onClick={() => setImportStep('upload')}
                className="p-2 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 active:scale-95 transition-all text-slate-600"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">确认词汇清单</h2>
            </div>

            {/* Custom Metadata inputs */}
            <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-4 space-y-3 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-400 tracking-wide block mb-1">词书名称</label>
                <input 
                  type="text" 
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value.substring(0, 15))}
                  className="w-full bg-white/70 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold outline-none transition"
                  placeholder="请输入词书标题"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 tracking-wide block mb-1">词书简介</label>
                <input 
                  type="text" 
                  value={bookDesc}
                  onChange={(e) => setBookDesc(e.target.value.substring(0, 50))}
                  className="w-full bg-white/70 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3 py-2 text-sm text-slate-600 outline-none transition"
                  placeholder="关于该词书的简介"
                />
              </div>
            </div>

            {wasSliced && (
              <div className="bg-amber-50/90 border border-amber-200 text-amber-800 text-xs rounded-2xl p-4 mb-4 leading-relaxed shadow-sm">
                <div className="font-bold mb-1 flex items-center gap-1">
                  <span>⚠️ 提示：检测到大量单词 ({originalCount} 个)</span>
                </div>
                <div>
                  为了确保浏览器界面流畅以及云端资源合理分配，单本自定义词书已自动精编至前 <b>5000</b> 个生词。同时，为了避免瞬间耗尽您的 Firebase 免费写配额，<b>每日限制导入 1 次自定义词书</b>。
                </div>
              </div>
            )}

            {/* Words list header */}
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs font-bold text-slate-500">
                已选中 {allExtractedWords.filter(w => selectedWordMap[w]).length} / {allExtractedWords.length} 个单词
              </span>
              <div className="space-x-3 text-xs">
                <button 
                  onClick={() => {
                    const next: Record<string, boolean> = {};
                    allExtractedWords.forEach(w => { next[w] = true; });
                    setSelectedWordMap(next);
                  }}
                  className="text-teal-600 font-semibold hover:underline"
                >
                  全选
                </button>
                <button 
                  onClick={() => {
                    const next: Record<string, boolean> = {};
                    allExtractedWords.forEach(w => { next[w] = false; });
                    setSelectedWordMap(next);
                  }}
                  className="text-slate-500 font-semibold hover:underline"
                >
                  清空
                </button>
              </div>
            </div>

            {/* Badges Grid Scroll Container */}
            <div className="flex-1 bg-white/30 backdrop-blur-md rounded-2xl border border-white/60 p-4 overflow-y-auto max-h-[300px] mb-6">
              <div className="flex flex-wrap gap-2">
                {allExtractedWords.map(word => {
                  const isChecked = !!selectedWordMap[word];
                  return (
                    <button
                      key={word}
                      onClick={() => setSelectedWordMap(prev => ({ ...prev, [word]: !prev[word] }))}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-all active:scale-95 ${isChecked ? 'bg-teal-500 text-white border-teal-600 shadow-sm shadow-teal-500/10' : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleConfirmImport}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 mb-16"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>智能补充词典并导入生词森林</span>
            </button>
          </motion.div>
        )}

        {/* Step 4: Loading & Processing Screen */}
        {importStep === 'processing' && (
          <motion.div 
            key="processing" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-8 mb-16"
          >
            <div className="relative w-28 h-28 flex items-center justify-center mb-6">
              {/* Spinning background circle */}
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle 
                  cx="56" 
                  cy="56" 
                  r="52" 
                  className="stroke-teal-500 stroke-[5px] fill-none transition-all duration-300"
                  strokeDasharray="326"
                  strokeDashoffset={326 - (326 * (pdfProgress > 0 ? pdfProgress : importProgress)) / 100}
                />
              </svg>
              <span className="text-xl font-extrabold text-slate-800">
                {pdfProgress > 0 ? `${pdfProgress}%` : `${importProgress}%`}
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">正在扫描与AI补充生词...</h3>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed animate-pulse">
              {currentProcessingWord}
            </p>
            
            <div className="mt-8 bg-teal-50/50 border border-teal-100 text-teal-700 p-4 rounded-2xl text-xs leading-relaxed max-w-xs">
              💡 正在深度融合您设备的本地背词缓存库及服务端 Gemini 大模型，将瞬间生成完全标准的国际音标、纯英美语语音、精妙考点释义和双语例句！
            </div>
          </motion.div>
        )}

        {/* Step 5: Success Screen */}
        {importStep === 'success' && (
          <motion.div 
            key="success" 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-8 mb-16"
          >
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-bold text-slate-800 mb-2">词书智能导入成功！</h3>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-8">
              您的专属自定义词书《{bookTitle}》已保存在云端。快去主页开始学习和培育生词森林吧！
            </p>

            <button
              onClick={() => {
                setImportStep('list');
                // Switch current book to the newly imported custom book
                const newlyCreated = customBooks[customBooks.length - 1];
                if (newlyCreated) {
                  onChangeBook(newlyCreated.id);
                } else if (customBooks.length > 0) {
                  onChangeBook(customBooks[customBooks.length - 1].id);
                }
              }}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-teal-500/10 active:scale-95 transition-all"
            >
              立即进入专属词书
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {bookToDelete && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookToDelete(null)}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-md z-40 rounded-3xl" 
            />
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-2xl z-50 text-center"
            >
              <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">删除自定义词书？</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                您确定要删除《{customBooks.find(b => b.id === bookToDelete)?.title || '该词书'}》吗？删除后，此词书的所有单词以及您在该词书下的背词进度将被永久清空，无法恢复！
              </p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setBookToDelete(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 active:scale-95 transition"
                >
                  取消
                </button>
                <button 
                  onClick={confirmDeleteBook}
                  className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-500/15 active:scale-95 transition"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BookCard({ title, desc, isCurrent, onClick, onDelete }: any) {
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-2xl border ${isCurrent ? 'bg-teal-500 text-white border-teal-600 shadow-lg shadow-teal-500/20' : 'bg-white/40 backdrop-blur-xl text-slate-800 border-white/60 shadow-sm'} flex items-center justify-between cursor-pointer hover:scale-[1.01] active:scale-95 transition-all duration-300 relative group`}
    >
      <div className="flex items-center space-x-4 pr-8">
        <div className={`p-3 rounded-xl flex-shrink-0 ${isCurrent ? 'bg-white/20' : 'bg-white/60 text-teal-600'}`}>
          <Book className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg tracking-wide">{title}</h3>
          <p className={`text-sm mt-1 ${isCurrent ? 'text-teal-50' : 'text-slate-500'}`}>{desc}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {isCurrent && <CheckCircle className="w-6 h-6 text-white" />}
        {onDelete && (
          <button 
            onClick={onDelete}
            className={`p-2 rounded-xl transition-all ${isCurrent ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
