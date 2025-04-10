document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const baseUrlInput = document.getElementById('baseUrl');
    const connectionStatus = document.getElementById('connectionStatus');
    const connectApiBtn = document.getElementById('connectApi');
    const toneSelect = document.getElementById('toneSelect');
    const srtFileInput = document.getElementById('srtFile');
    const fileNameDisplay = document.getElementById('fileName');
    const originalSubtitles = document.getElementById('originalSubtitles');
    const translatedSubtitles = document.getElementById('translatedSubtitles');
    const translateBtn = document.getElementById('translateBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resetFileBtn = document.getElementById('resetFileBtn');
    const saveBtn = document.getElementById('saveBtn');
    const themeToggle = document.getElementById('themeToggle');
    const notification = document.getElementById('notification');
    const container = document.querySelector('.container');
    const buttonTexts = document.querySelectorAll('.button-text');
    const progressSection = document.querySelector('.progress-section');
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    const remainingTime = document.getElementById('remainingTime');
    const originalCounter = document.getElementById('originalCounter');
    const translatedCounter = document.getElementById('translatedCounter');

    // Variables
    let srtContent = [];
    let translatedContent = [];
    let isTranslating = false;
    let isConnected = false;
    let pauseTranslation = false;
    let currentIndex = 0;
    let originalFileName = '';
    let baseUrl = localStorage.getItem('baseUrl') || 'http://localhost:1234/v1';
    
    // متغیرهای مربوط به محاسبه پیشرفت و زمان
    let translationStartTime;
    let translationTimes = [];
    let avgTranslationTime = 0;
    
    // بهینه‌سازی اندازه صفحه در زمان لود
    adjustUIForScreenSize();
    window.addEventListener('resize', adjustUIForScreenSize);
    window.addEventListener('orientationchange', adjustUIForScreenSize);
    
    // تنظیم آدرس ذخیره شده اگر وجود داشته باشد
    if (baseUrl) {
        baseUrlInput.value = baseUrl;
        testApiConnection(baseUrl);
    }

    // Set theme based on local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // بازیابی لحن ذخیره شده
    const savedTone = localStorage.getItem('selectedTone');
    if (savedTone) {
        toneSelect.value = savedTone;
    }

    // بازیابی وضعیت برنامه از localStorage
    loadAppState();

    // Event Listeners
    connectApiBtn.addEventListener('click', connectApi);
    srtFileInput.addEventListener('change', handleFileUpload);
    translateBtn.addEventListener('click', startTranslation);
    pauseBtn.addEventListener('click', pauseTranslationProcess);
    resumeBtn.addEventListener('click', resumeTranslationProcess);
    clearBtn.addEventListener('click', clearTranslationProcess);
    resetFileBtn.addEventListener('click', resetFile);
    saveBtn.addEventListener('click', saveTranslatedSubtitles);
    themeToggle.addEventListener('click', toggleTheme);
    toneSelect.addEventListener('change', function() {
        localStorage.setItem('selectedTone', toneSelect.value);
    });
    
    // ذخیره وضعیت برنامه قبل از رفرش/بستن صفحه
    window.addEventListener('beforeunload', saveAppState);
    
    // Event delegation for edit and retranslate buttons
    translatedSubtitles.addEventListener('click', function(e) {
        // Handle edit button clicks
        if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            const subtitleItem = e.target.closest('.subtitle-item');
            const subtitleText = subtitleItem.querySelector('.subtitle-text');
            const subtitleIndex = parseInt(subtitleItem.dataset.index);
            
            toggleEdit(subtitleText, subtitleIndex);
        }
        
        // Handle retranslate button clicks
        if (e.target.classList.contains('retranslate-btn') || e.target.closest('.retranslate-btn')) {
            const subtitleItem = e.target.closest('.subtitle-item');
            const subtitleIndex = parseInt(subtitleItem.dataset.index);
            
            retranslateSubtitle(subtitleIndex);
        }
    });
    
    // تنظیم سایز و نمایش المان‌ها بر اساس اندازه صفحه
    function adjustUIForScreenSize() {
        const isMobile = window.innerWidth <= 480;
        const isTablet = window.innerWidth > 480 && window.innerWidth <= 768;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // تنظیم ارتفاع کانتینرهای زیرنویس
        const subtitleContainers = document.querySelectorAll('.subtitle-container');
        
        if (isLandscape && (isMobile || isTablet)) {
            subtitleContainers.forEach(container => {
                container.style.height = '180px';
                container.style.maxHeight = '180px';
                container.style.minHeight = '150px';
            });
        } else if (isMobile) {
            subtitleContainers.forEach(container => {
                container.style.height = '250px';
                container.style.maxHeight = '250px';
                container.style.minHeight = '200px';
            });
        } else if (isTablet) {
            subtitleContainers.forEach(container => {
                container.style.height = '300px';
                container.style.maxHeight = '300px';
                container.style.minHeight = '250px';
            });
        } else {
            // دسکتاپ
            subtitleContainers.forEach(container => {
                container.style.height = '400px';
                container.style.maxHeight = '400px';
                container.style.minHeight = '300px';
            });
        }
        
        // تضمین حالت اسکرول برای کانتینرهای زیرنویس
        subtitleContainers.forEach(container => {
            container.style.overflowY = 'auto';
        });
        
        // بهینه‌سازی‌های بیشتر بر اساس نیاز
        if (isMobile && !isLandscape) {
            // برای گوشی‌های موبایل در حالت عمودی
            document.querySelectorAll('.subtitle-actions').forEach(actions => {
                actions.style.position = 'static';
                actions.style.opacity = '1';
                actions.style.marginTop = '10px';
            });
        } else {
            // برای سایر حالت‌ها
            document.querySelectorAll('.subtitle-actions').forEach(actions => {
                actions.style.position = '';
                actions.style.opacity = '';
                actions.style.marginTop = '';
            });
        }
    }

    // Functions
    function connectApi() {
        const baseUrlValue = baseUrlInput.value.trim();
        if (!baseUrlValue) {
            showNotification('لطفاً آدرس LM Studio را وارد کنید');
            return;
        }

        // ذخیره آدرس در localStorage
        localStorage.setItem('baseUrl', baseUrlValue);
        baseUrl = baseUrlValue;
        
        // بررسی اتصال
        testApiConnection(baseUrlValue);
    }

    async function testApiConnection(baseUrlValue) {
        showNotification('در حال بررسی اتصال به LM Studio...');
        connectionStatus.className = 'connection-status';
        
        try {
            // تست اتصال به LM Studio با استفاده از API models
            const modelsUrl = `${baseUrlValue}/models`;
            
            const response = await fetch(modelsUrl);
            
            if (response.ok) {
                connectionStatus.classList.add('connected');
                isConnected = true;
                showNotification('اتصال به LM Studio موفقیت‌آمیز بود');
                return;
            }
            
            // اگر اتصال موفق نبود
            connectionStatus.classList.add('disconnected');
            isConnected = false;
            showNotification('اتصال به LM Studio ناموفق بود. لطفاً مطمئن شوید که LM Studio در حال اجراست و Inference Server فعال است.');
            
        } catch (error) {
            console.error('LM Studio connection error:', error);
            connectionStatus.classList.add('disconnected');
            isConnected = false;
            showNotification('خطا در اتصال به LM Studio. لطفاً مطمئن شوید که LM Studio در حال اجراست و Inference Server فعال است.');
        }
    }

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.name.endsWith('.srt')) {
            fileNameDisplay.textContent = file.name;
            originalFileName = file.name.replace('.srt', '');
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                parseSRT(content);
            };
            reader.readAsText(file);
        } else {
            showNotification('لطفاً یک فایل SRT انتخاب کنید');
            srtFileInput.value = '';
            fileNameDisplay.textContent = 'فایلی انتخاب نشده';
        }
    }

    function parseSRT(content) {
        // پاک کردن محتوای قبلی
        srtContent = [];
        translatedContent = [];
        originalSubtitles.innerHTML = '';
        translatedSubtitles.innerHTML = '';
        
        // Split by double newline to separate subtitles
        const subtitles = content.split(/\r?\n\r?\n/);
        
        subtitles.forEach((subtitle, i) => {
            const lines = subtitle.trim().split(/\r?\n/);
            if (lines.length >= 3) {
                const index = parseInt(lines[0]) || i + 1;
                const timeCode = lines[1];
                const text = lines.slice(2).join('\n');
                
                if (text.trim() !== '') {
                    srtContent.push({
                        index: index,
                        timeCode: timeCode,
                        text: text
                    });
                    
                    // نمایش در UI
                    const subtitleElement = document.createElement('div');
                    subtitleElement.className = 'subtitle-item';
                    subtitleElement.dataset.index = i;
                    subtitleElement.innerHTML = `
                        <div class="subtitle-index">${index}</div>
                        <div class="subtitle-time">${timeCode}</div>
                        <div class="subtitle-text">${text}</div>
                    `;
                    originalSubtitles.appendChild(subtitleElement);
                }
            }
        });
        
        // بروزرسانی شمارشگر خطوط
        updateSubtitleCounters();
        
        showNotification(`${srtContent.length} خط زیرنویس بارگذاری شد`);
        translateBtn.disabled = false;
    }

    async function startTranslation() {
        if (!isConnected) {
            showNotification('لطفاً ابتدا به LM Studio متصل شوید');
            return;
        }
        
        if (!srtContent.length) {
            showNotification('لطفاً ابتدا یک فایل زیرنویس انتخاب کنید');
            return;
        }
        
        if (isTranslating) {
            showNotification('ترجمه در حال انجام است');
            return;
        }
        
        // مقداردهی اولیه متغیرهای پیشرفت
        translationStartTime = Date.now();
        translationTimes = [];
        avgTranslationTime = 0;
        
        isTranslating = true;
        pauseTranslation = false;
        currentIndex = 0;
        translatedContent = [];
        
        translateBtn.disabled = true;
        pauseBtn.disabled = false;
        resumeBtn.disabled = true;
        clearBtn.disabled = false;
        saveBtn.disabled = true;
        
        progressSection.style.display = 'block';
        updateProgress(0, 0);
        
        // پاک کردن محتوای قبلی
        translatedSubtitles.innerHTML = '';
        
        // اضافه کردن المان‌های خالی برای هر زیرنویس
        srtContent.forEach((item, index) => {
            addSubtitlePlaceholder(index);
        });
        
        showNotification('ترجمه آغاز شد');
        
        // شروع ترجمه زیرنویس‌ها
        await translateNextSubtitle();
    }

    async function translateNextSubtitle() {
        if (currentIndex >= srtContent.length || !isTranslating || pauseTranslation) {
            if (currentIndex >= srtContent.length) {
                finishTranslation();
            }
            return;
        }
        
        const subtitle = srtContent[currentIndex];
        const tone = toneSelect.value;
        
        try {
            const startTime = new Date();
            
            const translatedText = await translateText(subtitle.text, tone);
            
            // Calculate time taken for this translation
            const endTime = new Date();
            const timeTaken = (endTime - startTime) / 1000; // in seconds
            translationTimes.push(timeTaken);
            
            // Calculate average time and update progress
            updateTranslationProgress();
            
            // Save translated subtitle to array for later export
            translatedContent.push({
                index: subtitle.index,
                timeCode: subtitle.timeCode,
                text: translatedText
            });
            
            // پیدا کردن و به‌روزرسانی placeholder موجود
            const subtitleItem = translatedSubtitles.querySelector(`.subtitle-item[data-index="${currentIndex}"]`);
            if (subtitleItem) {
                // به‌روزرسانی متن زیرنویس و حذف کلاس placeholder
                const subtitleText = subtitleItem.querySelector('.subtitle-text');
                if (subtitleText) {
                    subtitleText.textContent = translatedText;
                    subtitleText.classList.remove('placeholder');
                }
                
                // اضافه کردن کد زمانی زیرنویس
                const timeElement = document.createElement('div');
                timeElement.className = 'subtitle-time';
                timeElement.textContent = subtitle.timeCode;
                subtitleItem.insertBefore(timeElement, subtitleText);
                
                // فعال‌سازی دکمه‌های ویرایش و ترجمه مجدد
                const editBtn = subtitleItem.querySelector('.edit-btn');
                const retranslateBtn = subtitleItem.querySelector('.retranslate-btn');
                
                if (editBtn) editBtn.disabled = false;
                if (retranslateBtn) retranslateBtn.disabled = false;
            }
            
            // بروزرسانی شمارشگر خطوط ترجمه شده
            updateSubtitleCounters();
            
            // Move to next subtitle
            currentIndex++;
            
            // Continue with next subtitle after a small delay
            setTimeout(translateNextSubtitle, 100);
        } catch (error) {
            console.error('Translation error:', error);
            showNotification('خطا در ترجمه. لطفاً دوباره تلاش کنید');
            pauseTranslationProcess();
        }
    }

    async function translateText(text, tone) {
        let prompt;

        switch (tone) {
            case 'normal':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن طبیعی و معمولی انجام بده. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'formal':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن رسمی و ادبی انجام بده. از واژگان سنجیده و ساختار جملات مؤدبانه استفاده کن. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'informal':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن غیررسمی و صمیمی انجام بده. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'professional':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن حرفه‌ای و تخصصی انجام بده. از واژگان دقیق و تخصصی استفاده کن اما پیچیده نباشد. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'scientific':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن علمی و آکادمیک انجام بده. از واژگان دقیق و علمی استفاده کن. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'informative':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن اطلاع‌رسانی و خبری انجام بده. از واژگان دقیق و شفاف استفاده کن. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'conversational':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن گفتاری و محاوره‌ای انجام بده. تا حد امکان به زبان روزمره و طبیعی نزدیک باشد. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'movie':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن محاوره‌ای مناسب فیلم و سریال انجام بده. از عبارات روزمره و گفتاری استفاده کن تا مخاطب راحت‌تر با آن ارتباط برقرار کند. از ترجمه رسمی و کتابی پرهیز کن. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'comedy':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن محاوره‌ای طنز و شوخی انجام بده. از اصطلاحات روزمره، شوخی‌های عامیانه و عبارات بامزه استفاده کن. ترجمه باید کاملاً گفتاری و غیررسمی باشد تا مخاطب راحت بخنده و ارتباط بگیره. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'action':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن محاوره‌ای و گفتاری مناسب فیلم‌های اکشن انجام بده. از عبارات کوتاه، پرانرژی و هیجانی استفاده کن که با روحیه فیلم‌های اکشن هماهنگ باشه. ترجمه باید روان، خودمونی و غیررسمی باشه. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'drama':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن محاوره‌ای احساسی و صمیمی انجام بده. از عبارات عاطفی، گفتاری و روزمره استفاده کن. ترجمه باید گرم، صمیمی و نزدیک به گفتار طبیعی باشه تا مخاطب با آن ارتباط عاطفی برقرار کنه. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'scifi':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن محاوره‌ای و گفتاری مناسب فیلم‌های علمی-تخیلی انجام بده. اصطلاحات تخصصی را به شکل روان و قابل فهم ترجمه کن، اما از زبان خشک و رسمی پرهیز کن. ترجمه باید طوری باشد که شخصیت‌ها انگار واقعاً دارند صحبت می‌کنند. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'documentary':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحنی میانه (نه خیلی رسمی و نه خیلی محاوره‌ای) مناسب مستند انجام بده. از زبان سنگین و آکادمیک پرهیز کن، اما دقت علمی را حفظ کن. ترجمه باید به گونه‌ای باشد که برای مخاطب عام قابل فهم و جذاب باشد. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'horror':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن مناسب فیلم‌های ترسناک انجام بده. از عبارات و واژگانی استفاده کن که حس تعلیق، ترس و اضطراب را منتقل کند. ترجمه باید دقیق، محاوره‌ای و تأثیرگذار باشد تا فضای دلهره‌آور فیلم حفظ شود. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'fantasy':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن مناسب فیلم‌های فانتزی انجام بده. اصطلاحات خاص دنیای فانتزی را با دقت ترجمه کن و سعی کن فضای رویایی و خیال‌انگیز فیلم را در ترجمه منتقل کنی. ترجمه باید محاوره‌ای اما در عین حال با شکوه و متناسب با دنیای فانتزی باشد. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'animation':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن مناسب انیمیشن و کارتون انجام بده. از عبارات ساده، سرزنده و پر انرژی استفاده کن. ترجمه باید شاد، روان و قابل فهم برای همه سنین باشد، اما بی‌مزه و بچگانه نباشد. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'kids':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن مناسب کودکان انجام بده. از واژگان ساده، جملات کوتاه و عبارات شاد استفاده کن. ترجمه باید کاملاً قابل فهم برای کودکان باشد و از کلمات پیچیده یا نامناسب پرهیز کند. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'historical':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن مناسب فیلم‌های تاریخی انجام بده. سعی کن حال و هوای دوره تاریخی را در ترجمه حفظ کنی، اما زبان باید قابل فهم و نه خیلی کهنه باشد. اصطلاحات تاریخی را با دقت ترجمه کن. ترجمه باید اصیل اما روان و قابل درک باشد. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            case 'romantic':
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن مناسب فیلم‌های عاشقانه انجام بده. از عبارات احساسی، لطیف و صمیمی استفاده کن. ترجمه باید حس عاطفی متن اصلی را منتقل کند و از واژگان خشک و بی‌روح پرهیز کند. فقط متن ترجمه شده را برگردان: "${text}"`;
                break;
            default:
                prompt = `ترجمه زیرنویس زیر را به فارسی با لحن محاوره‌ای و گفتاری انجام بده. از زبان رسمی و کتابی پرهیز کن. فقط متن ترجمه شده را برگردان: "${text}"`;
        }
        
        try {
            // استفاده از LM Studio API
            const chatUrl = `${baseUrl}/chat/completions`;
            
            const response = await fetch(chatUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'شما یک مترجم حرفه‌ای هستید که زیرنویس‌ها را به فارسی ترجمه می‌کند.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 256
                })
            });
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    }

    function updateTranslationProgress() {
        // Calculate average time per translation
        if (translationTimes.length > 0) {
            avgTranslationTime = translationTimes.reduce((a, b) => a + b, 0) / translationTimes.length;
        }
        
        // Calculate progress
        const totalSubtitles = srtContent.length;
        const completedSubtitles = currentIndex;
        const progressPercent = Math.round((completedSubtitles / totalSubtitles) * 100);
        
        // Estimate remaining time
        const remainingSubtitles = totalSubtitles - completedSubtitles;
        const estimatedRemainingSeconds = Math.round(remainingSubtitles * avgTranslationTime);
        
        updateProgress(progressPercent, estimatedRemainingSeconds);
    }

    function updateProgress(percent, remainingSeconds) {
        progressBar.style.width = `${percent}%`;
        progressPercentage.textContent = `${toPersianNumbers(percent)}٪`;
        
        if (remainingSeconds > 0) {
            const formattedTime = formatRemainingTime(remainingSeconds);
            remainingTime.textContent = `زمان باقیمانده: ${formattedTime}`;
        } else {
            remainingTime.textContent = 'زمان باقیمانده: در حال محاسبه...';
        }
    }

    function formatRemainingTime(seconds) {
        if (seconds < 60) {
            return `${toPersianNumbers(seconds)} ثانیه`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${toPersianNumbers(minutes)} دقیقه و ${toPersianNumbers(remainingSeconds)} ثانیه`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${toPersianNumbers(hours)} ساعت و ${toPersianNumbers(minutes)} دقیقه`;
        }
    }

    function toPersianNumbers(num) {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, x => persianDigits[x]);
    }

    function pauseTranslationProcess() {
        pauseTranslation = true;
        pauseBtn.disabled = true;
        resumeBtn.disabled = false;
        saveBtn.disabled = false;
        showNotification('ترجمه متوقف شد');
    }

    async function resumeTranslationProcess() {
        if (!isTranslating) return;
        
        // پاک کردن پلیس‌هولدرهای ناتمام (در صورت رفرش صفحه)
        const placeholders = translatedSubtitles.querySelectorAll('.subtitle-text.placeholder');
        if (placeholders.length > 0) {
            // فقط پلیس‌هولدرهای بعد از ایندکس فعلی را حفظ می‌کنیم
            for (let i = 0; i < placeholders.length; i++) {
                const placeholder = placeholders[i];
                const subtitleItem = placeholder.closest('.subtitle-item');
                const index = parseInt(subtitleItem.dataset.index);
                
                // اگر این زیرنویس قبلاً ترجمه نشده است
                if (!translatedContent.some(item => item.index === srtContent[index].index)) {
                    // ما آن را نگه می‌داریم تا ترجمه شود
                } else {
                    // این زیرنویس قبلاً ترجمه شده، پلیس‌هولدر را حذف می‌کنیم
                    placeholder.textContent = translatedContent.find(item => item.index === srtContent[index].index).text;
                    placeholder.classList.remove('placeholder');
                }
            }
        }
        
        pauseTranslation = false;
        translateBtn.disabled = true;
        pauseBtn.disabled = false;
        resumeBtn.disabled = true;
        
        // اگر هیچ زیرنویسی ترجمه نشده باشد، از ابتدا شروع می‌کنیم
        if (translatedContent.length === 0) {
            currentIndex = 0;
        }
        
        // نمایش قسمت پیشرفت ترجمه
        progressSection.style.display = 'block';
        
        // شروع/ادامه فرآیند ترجمه
        translateNextSubtitle();
    }

    function clearTranslationProcess() {
        if (isTranslating && !pauseTranslation) {
            showNotification('لطفاً ابتدا ترجمه را متوقف کنید');
            return;
        }
        
        isTranslating = false;
        pauseTranslation = false;
        currentIndex = 0;
        translatedContent = [];
        
        // پاک کردن محتوای ذخیره شده در localStorage
        localStorage.removeItem('translatedContent');
        localStorage.removeItem('translationState');
        
        // پاک کردن محتوای قبلی
        translatedSubtitles.innerHTML = '';
        
        // به‌روزرسانی دکمه‌ها
        translateBtn.disabled = false;
        pauseBtn.disabled = true;
        resumeBtn.disabled = true;
        clearBtn.disabled = true;
        saveBtn.disabled = true;
        
        // مخفی کردن نوار پیشرفت
        progressSection.style.display = 'none';
        
        // بروزرسانی شمارشگر خطوط
        updateSubtitleCounters();
        
        showNotification('ترجمه پاک شد');
    }

    function resetFile() {
        if (isTranslating && !pauseTranslation) {
            showNotification('لطفاً ابتدا ترجمه را متوقف کنید');
            return;
        }
        
        // پاک کردن همه‌چیز
        srtContent = [];
        translatedContent = [];
        originalSubtitles.innerHTML = '';
        translatedSubtitles.innerHTML = '';
        fileNameDisplay.textContent = 'فایلی انتخاب نشده';
        originalFileName = '';
        srtFileInput.value = '';
        
        // پاک کردن محتوای ذخیره شده در localStorage
        localStorage.removeItem('srtContent');
        localStorage.removeItem('translatedContent');
        localStorage.removeItem('originalFileName');
        localStorage.removeItem('translationState');
        
        // به‌روزرسانی دکمه‌ها
        translateBtn.disabled = true;
        pauseBtn.disabled = true;
        resumeBtn.disabled = true;
        clearBtn.disabled = true;
        saveBtn.disabled = true;
        
        // مخفی کردن نوار پیشرفت
        progressSection.style.display = 'none';
        
        // بروزرسانی شمارشگر خطوط
        updateSubtitleCounters();
        
        // ریست متغیرهای ترجمه
        isTranslating = false;
        pauseTranslation = false;
        currentIndex = 0;
        
        showNotification('فایل پاک شد');
    }

    function finishTranslation() {
        isTranslating = false;
        
        // به‌روزرسانی دکمه‌ها
        translateBtn.disabled = false;
        pauseBtn.disabled = true;
        resumeBtn.disabled = true;
        clearBtn.disabled = false;
        saveBtn.disabled = false;
        
        showNotification('ترجمه با موفقیت به پایان رسید');
    }

    function saveTranslatedSubtitles() {
        if (translatedContent.length === 0) {
            showNotification('زیرنویسی برای ذخیره وجود ندارد');
            return;
        }
        
        let srtOutput = '';
        translatedContent.forEach(subtitle => {
            srtOutput += `${subtitle.index}\n`;
            srtOutput += `${subtitle.timeCode}\n`;
            srtOutput += `${subtitle.text}\n\n`;
        });
        
        // Create file name
        let fileName;
        if (currentIndex < srtContent.length) {
            // ترجمه ناقص است
            fileName = `${originalFileName}_fa_ناقص.srt`;
        } else {
            // ترجمه کامل است
            fileName = `${originalFileName}_fa.srt`;
        }
        
        // Create download link
        const blob = new Blob([srtOutput], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        
        showNotification(`فایل زیرنویس با نام ${fileName} ذخیره شد`);
    }
    
    // Function to toggle edit mode for a subtitle
    function toggleEdit(subtitleTextElement, index) {
        const isEditing = subtitleTextElement.contentEditable === 'true';
        
        if (isEditing) {
            // Save changes
            subtitleTextElement.contentEditable = 'false';
            subtitleTextElement.classList.remove('editing');
            
            // Update translated content in the array
            const newText = subtitleTextElement.innerText.trim();
            translatedContent[index].text = newText;
            
            showNotification('تغییرات ذخیره شد');
        } else {
            // Enter edit mode
            subtitleTextElement.contentEditable = 'true';
            subtitleTextElement.classList.add('editing');
            subtitleTextElement.focus();
            
            // Place cursor at the end
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(subtitleTextElement);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
            
            showNotification('در حال ویرایش. برای ذخیره، دوباره کلیک کنید');
        }
    }
    
    // Function to retranslate a specific subtitle
    async function retranslateSubtitle(index) {
        if (!isConnected) {
            showNotification('لطفاً ابتدا به LM Studio متصل شوید');
            return;
        }
        
        const subtitle = srtContent[index];
        const subtitleItem = translatedSubtitles.querySelector(`[data-index="${index}"]`);
        const subtitleText = subtitleItem.querySelector('.subtitle-text');
        const retranslateBtn = subtitleItem.querySelector('.retranslate-btn');
        
        // Disable retranslate button and show loading state
        retranslateBtn.disabled = true;
        retranslateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        try {
            const tone = toneSelect.value;
            const translatedText = await translateText(subtitle.text, tone);
            
            // Update the displayed text
            subtitleText.textContent = translatedText;
            
            // Update content in the array
            translatedContent[index].text = translatedText;
            
            showNotification('ترجمه مجدد با موفقیت انجام شد');
        } catch (error) {
            console.error('Retranslation error:', error);
            showNotification('خطا در ترجمه مجدد');
        } finally {
            // Restore button state
            retranslateBtn.disabled = false;
            retranslateBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        }
    }

    function toggleTheme() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }

    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    function updateSubtitleCounters() {
        originalCounter.textContent = `تعداد خطوط: ${toPersianNumbers(srtContent.length)}`;
        translatedCounter.textContent = `تعداد خطوط: ${toPersianNumbers(translatedContent.length)}`;
    }

    function addSubtitlePlaceholder(index) {
        const subtitleElement = document.createElement('div');
        subtitleElement.className = 'subtitle-item';
        subtitleElement.dataset.index = index;
        
        // نمایش شماره index
        const indexElement = document.createElement('div');
        indexElement.className = 'subtitle-index';
        indexElement.textContent = srtContent[index].index;
        subtitleElement.appendChild(indexElement);
        
        // محل متن زیرنویس
        const textElement = document.createElement('div');
        textElement.className = 'subtitle-text placeholder';
        textElement.textContent = 'در انتظار ترجمه...';
        subtitleElement.appendChild(textElement);
        
        // دکمه‌های ویرایش و ترجمه مجدد
        const actionsElement = document.createElement('div');
        actionsElement.className = 'subtitle-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.disabled = true;
        actionsElement.appendChild(editBtn);
        
        const retranslateBtn = document.createElement('button');
        retranslateBtn.className = 'retranslate-btn';
        retranslateBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        retranslateBtn.disabled = true;
        actionsElement.appendChild(retranslateBtn);
        
        subtitleElement.appendChild(actionsElement);
        
        translatedSubtitles.appendChild(subtitleElement);
    }

    // ذخیره وضعیت برنامه در localStorage
    function saveAppState() {
        // ذخیره محتوای زیرنویس اصلی
        if (srtContent.length > 0) {
            localStorage.setItem('srtContent', JSON.stringify(srtContent));
        }
        
        // ذخیره محتوای ترجمه شده
        if (translatedContent.length > 0) {
            localStorage.setItem('translatedContent', JSON.stringify(translatedContent));
        }
        
        // ذخیره نام فایل اصلی
        if (originalFileName) {
            localStorage.setItem('originalFileName', originalFileName);
        }
        
        // ذخیره وضعیت ترجمه
        localStorage.setItem('translationState', JSON.stringify({
            isTranslating,
            pauseTranslation,
            currentIndex
        }));
    }
    
    // بازیابی وضعیت برنامه از localStorage
    function loadAppState() {
        // بازیابی محتوای زیرنویس اصلی
        const savedSrtContent = localStorage.getItem('srtContent');
        if (savedSrtContent) {
            srtContent = JSON.parse(savedSrtContent);
            
            // نمایش زیرنویس‌های اصلی در UI
            originalSubtitles.innerHTML = '';
            srtContent.forEach((subtitle, i) => {
                const subtitleElement = document.createElement('div');
                subtitleElement.className = 'subtitle-item';
                subtitleElement.dataset.index = i;
                subtitleElement.innerHTML = `
                    <div class="subtitle-index">${subtitle.index}</div>
                    <div class="subtitle-time">${subtitle.timeCode}</div>
                    <div class="subtitle-text">${subtitle.text}</div>
                `;
                originalSubtitles.appendChild(subtitleElement);
            });
            
            // فعال کردن دکمه‌های مربوطه
            translateBtn.disabled = false;
        }
        
        // بازیابی محتوای ترجمه شده
        const savedTranslatedContent = localStorage.getItem('translatedContent');
        if (savedTranslatedContent) {
            translatedContent = JSON.parse(savedTranslatedContent);
            
            // نمایش زیرنویس‌های ترجمه شده در UI
            translatedSubtitles.innerHTML = '';
            translatedContent.forEach((subtitle, i) => {
                const subtitleElement = document.createElement('div');
                subtitleElement.className = 'subtitle-item';
                subtitleElement.dataset.index = i;
                
                const indexElement = document.createElement('div');
                indexElement.className = 'subtitle-index';
                indexElement.textContent = subtitle.index;
                subtitleElement.appendChild(indexElement);
                
                const timeElement = document.createElement('div');
                timeElement.className = 'subtitle-time';
                timeElement.textContent = subtitle.timeCode;
                subtitleElement.appendChild(timeElement);
                
                const textElement = document.createElement('div');
                textElement.className = 'subtitle-text';
                textElement.textContent = subtitle.text;
                subtitleElement.appendChild(textElement);
                
                // دکمه‌های ویرایش و ترجمه مجدد
                const actionsElement = document.createElement('div');
                actionsElement.className = 'subtitle-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                actionsElement.appendChild(editBtn);
                
                const retranslateBtn = document.createElement('button');
                retranslateBtn.className = 'retranslate-btn';
                retranslateBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                actionsElement.appendChild(retranslateBtn);
                
                subtitleElement.appendChild(actionsElement);
                
                translatedSubtitles.appendChild(subtitleElement);
            });
            
            // فعال کردن دکمه‌های مربوطه
            clearBtn.disabled = false;
            saveBtn.disabled = false;
        }
        
        // بازیابی نام فایل اصلی
        const savedFileName = localStorage.getItem('originalFileName');
        if (savedFileName) {
            originalFileName = savedFileName;
            fileNameDisplay.textContent = `${originalFileName}.srt`;
        }
        
        // بازیابی وضعیت ترجمه
        const savedTranslationState = localStorage.getItem('translationState');
        if (savedTranslationState) {
            const state = JSON.parse(savedTranslationState);
            currentIndex = state.currentIndex;
            
            // اگر ترجمه در حال انجام بوده و متوقف شده است
            if (state.isTranslating && state.pauseTranslation) {
                isTranslating = true;
                pauseTranslation = true;
                
                // فعال/غیرفعال کردن دکمه‌های مربوطه
                translateBtn.disabled = true;
                pauseBtn.disabled = true;
                resumeBtn.disabled = false;
                clearBtn.disabled = false;
                saveBtn.disabled = false;
                progressSection.style.display = 'block';
                
                // نمایش پیشرفت ترجمه
                const progressPercent = Math.round((currentIndex / srtContent.length) * 100);
                updateProgress(progressPercent, 0);
                
                // ایجاد پلیس‌هولدر برای زیرنویس‌های باقیمانده
                for (let i = currentIndex; i < srtContent.length; i++) {
                    if (!translatedContent.some(item => item.index === srtContent[i].index)) {
                        addSubtitlePlaceholder(i);
                    }
                }
                
                showNotification(`ترجمه در ${progressPercent}% متوقف شده است. برای ادامه روی دکمه ادامه کلیک کنید`);
            }
            // اگر ترجمه تمام شده است
            else if (state.isTranslating && currentIndex >= srtContent.length) {
                isTranslating = false;
                pauseTranslation = false;
                
                // فعال/غیرفعال کردن دکمه‌های مربوطه
                translateBtn.disabled = false;
                pauseBtn.disabled = true;
                resumeBtn.disabled = true;
                clearBtn.disabled = false;
                saveBtn.disabled = false;
                progressSection.style.display = 'block';
                
                // نمایش پیشرفت ترجمه
                updateProgress(100, 0);
            }
            // اگر ترجمه در جریان بوده و رفرش شده (بدون توقف عمدی)
            else if (state.isTranslating && !state.pauseTranslation) {
                isTranslating = true;
                pauseTranslation = true; // توقف موقت برای ادامه کار با دکمه ادامه
                
                // فعال/غیرفعال کردن دکمه‌های مربوطه
                translateBtn.disabled = true;
                pauseBtn.disabled = true;
                resumeBtn.disabled = false;
                clearBtn.disabled = false;
                saveBtn.disabled = false;
                progressSection.style.display = 'block';
                
                // نمایش پیشرفت ترجمه
                const progressPercent = Math.round((currentIndex / srtContent.length) * 100);
                updateProgress(progressPercent, 0);
                
                // ایجاد پلیس‌هولدر برای زیرنویس‌های باقیمانده
                for (let i = currentIndex; i < srtContent.length; i++) {
                    if (!translatedContent.some(item => item.index === srtContent[i].index)) {
                        addSubtitlePlaceholder(i);
                    }
                }
                
                showNotification(`صفحه رفرش شده است. ترجمه در ${progressPercent}% متوقف شده است. برای ادامه روی دکمه ادامه کلیک کنید`);
            }
        }
        
        // بازیابی لحن انتخاب شده
        const savedTone = localStorage.getItem('selectedTone');
        if (savedTone) {
            toneSelect.value = savedTone;
        }
        
        // بروزرسانی شمارشگر خطوط
        updateSubtitleCounters();
    }
}); 