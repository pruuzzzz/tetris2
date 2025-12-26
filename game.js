/**
 * Tetris Game with Player & AI Mode
 * 
 * 구조:
 * - Piece: 테트로미노 블록 정보 및 회전
 * - Board: 게임 보드 데이터 및 충돌 처리
 * - AIController: AI 자동 플레이 판단 로직
 * - Game: 게임 루프 및 상태 관리
 */

// ==================== PIECE 클래스 ====================
// 테트로미노 블록의 모양, 색상, 회전을 담당
class Piece {
    // 7가지 테트로미노 정의 (I, O, T, S, Z, J, L)
    static SHAPES = {
        I: [
            [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
            [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
            [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
            [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]]
        ],
        O: [
            [[1, 1], [1, 1]],
            [[1, 1], [1, 1]],
            [[1, 1], [1, 1]],
            [[1, 1], [1, 1]]
        ],
        T: [
            [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
            [[0, 1, 0], [1, 1, 0], [0, 1, 0]]
        ],
        S: [
            [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
            [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
            [[1, 0, 0], [1, 1, 0], [0, 1, 0]]
        ],
        Z: [
            [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
            [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
            [[0, 1, 0], [1, 1, 0], [1, 0, 0]]
        ],
        J: [
            [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
            [[0, 1, 0], [0, 1, 0], [1, 1, 0]]
        ],
        L: [
            [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
            [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
            [[1, 1, 0], [0, 1, 0], [0, 1, 0]]
        ]
    };

    // 각 테트로미노의 색상
    static COLORS = {
        I: '#00d4ff', // 시안
        O: '#ffd700', // 노랑
        T: '#9b59b6', // 보라
        S: '#2ecc71', // 초록
        Z: '#e74c3c', // 빨강
        J: '#3498db', // 파랑
        L: '#e67e22'  // 주황
    };

    constructor(type) {
        this.type = type;
        this.rotation = 0;
        this.x = 3; // 시작 x 위치 (보드 중앙)
        this.y = 0; // 시작 y 위치 (상단)
    }

    // 현재 회전 상태의 모양 반환
    getShape() {
        return Piece.SHAPES[this.type][this.rotation];
    }

    // 색상 반환
    getColor() {
        return Piece.COLORS[this.type];
    }

    // 시계 방향 회전 (다음 회전 상태 반환)
    getNextRotation() {
        return (this.rotation + 1) % 4;
    }

    // 회전 적용
    rotate() {
        this.rotation = this.getNextRotation();
    }

    // 복사본 생성
    clone() {
        const piece = new Piece(this.type);
        piece.rotation = this.rotation;
        piece.x = this.x;
        piece.y = this.y;
        return piece;
    }

    // 랜덤 블록 생성
    static random() {
        const types = Object.keys(Piece.SHAPES);
        const randomType = types[Math.floor(Math.random() * types.length)];
        return new Piece(randomType);
    }
}

// ==================== BOARD 클래스 ====================
// 게임 보드 데이터 관리 및 충돌 처리
class Board {
    constructor(width = 10, height = 20) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
    }

    // 빈 그리드 생성
    createEmptyGrid() {
        return Array.from({ length: this.height }, () =>
            Array(this.width).fill(null)
        );
    }

    // 보드 초기화
    reset() {
        this.grid = this.createEmptyGrid();
    }

    // 특정 위치가 유효한지 확인
    isValidPosition(piece, offsetX = 0, offsetY = 0, rotation = null) {
        const shape = rotation !== null
            ? Piece.SHAPES[piece.type][rotation]
            : piece.getShape();
        const newX = piece.x + offsetX;
        const newY = piece.y + offsetY;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = newX + col;
                    const boardY = newY + row;

                    // 보드 범위 체크
                    if (boardX < 0 || boardX >= this.width ||
                        boardY < 0 || boardY >= this.height) {
                        return false;
                    }

                    // 다른 블록과 충돌 체크
                    if (this.grid[boardY][boardX] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // 블록을 보드에 고정
    lockPiece(piece) {
        const shape = piece.getShape();
        const color = piece.getColor();

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = piece.x + col;
                    const boardY = piece.y + row;
                    if (boardY >= 0 && boardY < this.height) {
                        this.grid[boardY][boardX] = color;
                    }
                }
            }
        }
    }

    // 완성된 줄 제거 및 점수 반환
    clearLines() {
        let linesCleared = 0;

        for (let row = this.height - 1; row >= 0; row--) {
            // 줄이 모두 채워져 있는지 확인
            if (this.grid[row].every(cell => cell !== null)) {
                // 해당 줄 제거
                this.grid.splice(row, 1);
                // 맨 위에 빈 줄 추가
                this.grid.unshift(Array(this.width).fill(null));
                linesCleared++;
                row++; // 같은 위치 다시 확인
            }
        }

        return linesCleared;
    }

    // 보드 복사 (AI 시뮬레이션용)
    clone() {
        const newBoard = new Board(this.width, this.height);
        newBoard.grid = this.grid.map(row => [...row]);
        return newBoard;
    }

    // 보드 높이 계산 (가장 높은 블록의 높이)
    getHeight() {
        for (let row = 0; row < this.height; row++) {
            if (this.grid[row].some(cell => cell !== null)) {
                return this.height - row;
            }
        }
        return 0;
    }

    // 빈 공간(holes) 개수 계산
    getHoles() {
        let holes = 0;
        for (let col = 0; col < this.width; col++) {
            let blockFound = false;
            for (let row = 0; row < this.height; row++) {
                if (this.grid[row][col] !== null) {
                    blockFound = true;
                } else if (blockFound) {
                    holes++;
                }
            }
        }
        return holes;
    }

    // 울퉁불퉁함(bumpiness) 계산
    getBumpiness() {
        const heights = [];
        for (let col = 0; col < this.width; col++) {
            let height = 0;
            for (let row = 0; row < this.height; row++) {
                if (this.grid[row][col] !== null) {
                    height = this.height - row;
                    break;
                }
            }
            heights.push(height);
        }

        let bumpiness = 0;
        for (let i = 0; i < heights.length - 1; i++) {
            bumpiness += Math.abs(heights[i] - heights[i + 1]);
        }
        return bumpiness;
    }
}

// ==================== AI CONTROLLER 클래스 ====================
// AI 자동 플레이 판단 로직
class AIController {
    /**
     * AI 휴리스틱 가중치
     * 이 값들을 조정하여 AI의 플레이 스타일을 변경할 수 있음
     */
    static WEIGHTS = {
        linesCleared: 760,    // 완성된 줄 수 (높을수록 좋음)
        holes: -350,          // 빈 공간 개수 (낮을수록 좋음)
        height: -180,         // 보드 높이 (낮을수록 좋음)
        bumpiness: -180       // 울퉁불퉁함 (낮을수록 좋음)
    };

    constructor(game) {
        this.game = game;
        this.targetRotation = 0;
        this.targetX = 0;
        this.isMoving = false;
        this.moveInterval = null;
        this.actionSpeed = 200; // AI 행동 간격 (ms)
    }

    /**
     * 현재 상태에서 최적의 위치와 회전을 찾음
     * 모든 가능한 위치를 시뮬레이션하고 점수를 계산
     */
    findBestMove(board, piece) {
        let bestScore = -Infinity;
        let bestMove = { rotation: 0, x: 0 };

        // 모든 회전 상태에 대해 검사 (0, 1, 2, 3)
        for (let rotation = 0; rotation < 4; rotation++) {
            const testPiece = piece.clone();
            testPiece.rotation = rotation;

            // 모든 x 위치에 대해 검사
            for (let x = -2; x < board.width; x++) {
                testPiece.x = x;
                testPiece.y = 0;

                // 유효한 위치인지 확인
                if (!board.isValidPosition(testPiece, 0, 0, rotation)) {
                    continue;
                }

                // 하드 드롭 시뮬레이션
                const dropPiece = testPiece.clone();
                while (board.isValidPosition(dropPiece, 0, 1)) {
                    dropPiece.y++;
                }

                // 이 위치에서의 점수 계산
                const score = this.evaluateMove(board, dropPiece);

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { rotation, x };
                }
            }
        }

        return bestMove;
    }

    /**
     * 특정 위치에 블록을 놓았을 때의 점수 계산
     * 휴리스틱 함수: 줄 완성, 빈 공간, 높이, 울퉁불퉁함을 고려
     */
    evaluateMove(board, piece) {
        // 보드 복사 후 블록 배치 시뮬레이션
        const testBoard = board.clone();
        testBoard.lockPiece(piece);

        // 완성된 줄 수 계산
        const linesCleared = testBoard.clearLines();

        // 각 지표 계산
        const holes = testBoard.getHoles();
        const height = testBoard.getHeight();
        const bumpiness = testBoard.getBumpiness();

        /**
         * 점수 계산 공식:
         * = (완성 줄 × 가중치) + (빈공간 × 가중치) + (높이 × 가중치) + (울퉁불퉁함 × 가중치)
         * 
         * 양수 가중치: 높을수록 좋은 지표 (줄 완성)
         * 음수 가중치: 낮을수록 좋은 지표 (빈공간, 높이, 울퉁불퉁함)
         */
        return (
            AIController.WEIGHTS.linesCleared * linesCleared +
            AIController.WEIGHTS.holes * holes +
            AIController.WEIGHTS.height * height +
            AIController.WEIGHTS.bumpiness * bumpiness
        );
    }

    // AI 행동 시작
    startAI() {
        this.stopAI();
        this.calculateNextMove();

        // 일정 간격으로 AI 행동 실행
        this.moveInterval = setInterval(() => {
            this.executeMove();
        }, this.actionSpeed);
    }

    // AI 행동 중지
    stopAI() {
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
        this.isMoving = false;
    }

    // 다음 이동 계산
    calculateNextMove() {
        if (!this.game.currentPiece) return;

        const bestMove = this.findBestMove(this.game.board, this.game.currentPiece);
        this.targetRotation = bestMove.rotation;
        this.targetX = bestMove.x;
        this.isMoving = true;
    }

    // 계산된 이동 실행
    executeMove() {
        if (!this.game.isRunning || this.game.isPaused || !this.game.currentPiece) {
            return;
        }

        const piece = this.game.currentPiece;

        // 1단계: 회전이 필요한 경우 회전
        if (piece.rotation !== this.targetRotation) {
            this.game.rotatePiece();
            return;
        }

        // 2단계: 좌우 이동
        if (piece.x < this.targetX) {
            this.game.movePiece(1, 0);
            return;
        } else if (piece.x > this.targetX) {
            this.game.movePiece(-1, 0);
            return;
        }

        // 3단계: 위치에 도달하면 하드 드롭
        this.game.hardDrop();

        // 다음 블록에 대한 이동 계산
        setTimeout(() => {
            this.calculateNextMove();
        }, 50);
    }

    // AI 속도 설정
    setSpeed(speed) {
        this.actionSpeed = speed;
        if (this.moveInterval) {
            this.stopAI();
            this.startAI();
        }
    }
}

// ==================== GAME 클래스 ====================
// 게임 루프 및 상태 관리
class Game {
    constructor() {
        // 캔버스 설정
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas.getContext('2d');

        // 블록 크기 계산
        this.blockSize = this.canvas.width / 10;
        this.previewBlockSize = 25;

        // 게임 상태
        this.board = new Board(10, 20);
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;

        this.score = 0;
        this.level = 1;
        this.lines = 0;

        this.isRunning = false;
        this.isPaused = false;
        this.isAIMode = false;

        this.dropInterval = null;
        this.lastDropTime = 0;
        this.dropDelay = 1000;

        // AI 컨트롤러
        this.aiController = new AIController(this);

        // UI 요소
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.linesElement = document.getElementById('lines');
        this.overlay = document.getElementById('game-overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlayMessage = document.getElementById('overlay-message');

        // 이벤트 바인딩
        this.bindEvents();
    }

    // 이벤트 리스너 바인딩
    bindEvents() {
        // 키보드 이벤트 (Player Mode)
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // 시작 버튼
        document.getElementById('start-btn').addEventListener('click', () => {
            this.start();
        });

        // 일시정지 버튼
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });

        // 모드 전환 버튼
        // ===== 모드 전환 이벤트 핸들러 =====
        document.getElementById('player-btn').addEventListener('click', () => {
            this.setMode(false); // Player Mode로 전환
        });

        document.getElementById('ai-btn').addEventListener('click', () => {
            this.setMode(true); // AI Mode로 전환
        });

        // AI 속도 슬라이더
        const aiSpeedSlider = document.getElementById('ai-speed');
        const aiSpeedValue = document.getElementById('ai-speed-value');

        aiSpeedSlider.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            aiSpeedValue.textContent = `${speed}ms`;
            this.aiController.setSpeed(speed);
        });
    }

    /**
     * 모드 전환 함수
     * @param {boolean} isAI - true: AI Mode, false: Player Mode
     * 
     * 모드 전환 시:
     * 1. UI 버튼 상태 업데이트
     * 2. AI 속도 슬라이더 표시/숨김
     * 3. 게임 실행 중이면 AI 시작/중지
     */
    setMode(isAI) {
        this.isAIMode = isAI;

        // UI 업데이트
        const playerBtn = document.getElementById('player-btn');
        const aiBtn = document.getElementById('ai-btn');
        const aiSpeedContainer = document.getElementById('ai-speed-container');

        if (isAI) {
            playerBtn.classList.remove('active');
            aiBtn.classList.add('active');
            aiSpeedContainer.classList.add('visible');

            // 게임 실행 중이면 AI 시작
            if (this.isRunning && !this.isPaused) {
                this.aiController.calculateNextMove();
                this.aiController.startAI();
            }
        } else {
            aiBtn.classList.remove('active');
            playerBtn.classList.add('active');
            aiSpeedContainer.classList.remove('visible');

            // AI 중지
            this.aiController.stopAI();
        }
    }

    // 키보드 입력 처리 (Player Mode에서만 동작)
    handleKeyDown(e) {
        if (!this.isRunning || this.isPaused || this.isAIMode) return;

        switch (e.key) {
            case 'ArrowLeft':
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.movePiece(1, 0);
                break;
            case 'ArrowUp':
                this.rotatePiece();
                break;
            case 'ArrowDown':
                this.softDrop();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'c':
            case 'C':
                this.holdCurrentPiece();
                break;
        }
    }

    // 게임 시작
    start() {
        this.reset();
        this.isRunning = true;
        this.isPaused = false;

        this.spawnPiece();
        this.overlay.classList.add('hidden');

        document.getElementById('start-btn').textContent = 'RESTART';
        document.getElementById('pause-btn').disabled = false;

        this.startDropLoop();

        // AI 모드면 AI 시작
        if (this.isAIMode) {
            this.aiController.calculateNextMove();
            this.aiController.startAI();
        }
    }

    // 게임 리셋
    reset() {
        this.board.reset();
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropDelay = 1000;

        this.updateUI();
        this.draw();
    }

    // 새 블록 생성
    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            this.currentPiece = Piece.random();
        }

        this.currentPiece.x = 3;
        this.currentPiece.y = 0;
        this.nextPiece = Piece.random();
        this.canHold = true;

        // 게임 오버 체크
        if (!this.board.isValidPosition(this.currentPiece)) {
            this.gameOver();
        }

        this.draw();
    }

    // 블록 이동
    movePiece(dx, dy) {
        if (!this.currentPiece) return;

        if (this.board.isValidPosition(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            this.draw();
            return true;
        }
        return false;
    }

    // 블록 회전
    rotatePiece() {
        if (!this.currentPiece) return;

        const nextRotation = this.currentPiece.getNextRotation();

        // 기본 회전 시도
        if (this.board.isValidPosition(this.currentPiece, 0, 0, nextRotation)) {
            this.currentPiece.rotate();
            this.draw();
            return true;
        }

        // 벽 킥 시도 (좌우로 밀어서 회전)
        const kicks = [-1, 1, -2, 2];
        for (const kick of kicks) {
            if (this.board.isValidPosition(this.currentPiece, kick, 0, nextRotation)) {
                this.currentPiece.x += kick;
                this.currentPiece.rotate();
                this.draw();
                return true;
            }
        }

        return false;
    }

    // 소프트 드롭 (빠른 하강)
    softDrop() {
        if (this.movePiece(0, 1)) {
            this.score += 1;
            this.updateUI();
        }
    }

    // 하드 드롭 (즉시 하강)
    hardDrop() {
        if (!this.currentPiece) return;

        let dropDistance = 0;
        while (this.board.isValidPosition(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }

        this.score += dropDistance * 2;
        this.lockCurrentPiece();
    }

    // 홀드 기능
    holdCurrentPiece() {
        if (!this.canHold || !this.currentPiece) return;

        const temp = this.holdPiece;
        this.holdPiece = new Piece(this.currentPiece.type);

        if (temp) {
            this.currentPiece = temp;
            this.currentPiece.x = 3;
            this.currentPiece.y = 0;
        } else {
            this.spawnPiece();
        }

        this.canHold = false;
        this.draw();
    }

    // 블록 고정 및 줄 제거
    lockCurrentPiece() {
        this.board.lockPiece(this.currentPiece);

        const clearedLines = this.board.clearLines();
        if (clearedLines > 0) {
            this.lines += clearedLines;
            this.addScore(clearedLines);
            this.updateLevel();
        }

        this.updateUI();
        this.spawnPiece();

        // AI 모드면 다음 이동 계산
        if (this.isAIMode && this.isRunning) {
            this.aiController.calculateNextMove();
        }
    }

    // 점수 추가 (줄 수에 따른 점수)
    addScore(lines) {
        const points = [0, 100, 300, 500, 800];
        this.score += points[lines] * this.level;
    }

    // 레벨 업데이트
    updateLevel() {
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropDelay = Math.max(100, 1000 - (this.level - 1) * 100);
        }
    }

    // 드롭 루프 시작
    startDropLoop() {
        if (this.dropInterval) {
            clearInterval(this.dropInterval);
        }

        this.dropInterval = setInterval(() => {
            if (!this.isPaused && this.isRunning) {
                if (!this.movePiece(0, 1)) {
                    this.lockCurrentPiece();
                }
            }
        }, this.dropDelay);
    }

    // 일시정지 토글
    togglePause() {
        this.isPaused = !this.isPaused;

        const pauseBtn = document.getElementById('pause-btn');

        if (this.isPaused) {
            pauseBtn.textContent = 'RESUME';
            this.overlayTitle.textContent = 'PAUSED';
            this.overlayMessage.textContent = 'Press RESUME to continue';
            this.overlay.classList.remove('hidden');

            if (this.isAIMode) {
                this.aiController.stopAI();
            }
        } else {
            pauseBtn.textContent = 'PAUSE';
            this.overlay.classList.add('hidden');

            if (this.isAIMode) {
                this.aiController.startAI();
            }
        }
    }

    // 게임 오버
    gameOver() {
        this.isRunning = false;
        this.aiController.stopAI();

        if (this.dropInterval) {
            clearInterval(this.dropInterval);
        }

        this.overlayTitle.textContent = 'GAME OVER';
        this.overlayMessage.textContent = `Final Score: ${this.score}`;
        this.overlay.classList.remove('hidden');

        document.getElementById('pause-btn').disabled = true;
    }

    // UI 업데이트
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.linesElement.textContent = this.lines;
    }

    // 화면 그리기
    draw() {
        this.drawBoard();
        this.drawGhostPiece();
        this.drawCurrentPiece();
        this.drawNextPiece();
        this.drawHoldPiece();
    }

    // 보드 그리기
    drawBoard() {
        // 배경
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 그리드 라인
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= this.board.width; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.board.height; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.canvas.width, y * this.blockSize);
            this.ctx.stroke();
        }

        // 고정된 블록
        for (let row = 0; row < this.board.height; row++) {
            for (let col = 0; col < this.board.width; col++) {
                const color = this.board.grid[row][col];
                if (color) {
                    this.drawBlock(this.ctx, col, row, color, this.blockSize);
                }
            }
        }
    }

    // 고스트 피스 그리기 (하드 드롭 위치 미리보기)
    drawGhostPiece() {
        if (!this.currentPiece) return;

        const ghost = this.currentPiece.clone();
        while (this.board.isValidPosition(ghost, 0, 1)) {
            ghost.y++;
        }

        const shape = ghost.getShape();
        const color = ghost.getColor();

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = (ghost.x + col) * this.blockSize;
                    const y = (ghost.y + row) * this.blockSize;

                    this.ctx.fillStyle = color + '30';
                    this.ctx.fillRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);

                    this.ctx.strokeStyle = color + '50';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);
                }
            }
        }
    }

    // 현재 블록 그리기
    drawCurrentPiece() {
        if (!this.currentPiece) return;

        const shape = this.currentPiece.getShape();
        const color = this.currentPiece.getColor();

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawBlock(
                        this.ctx,
                        this.currentPiece.x + col,
                        this.currentPiece.y + row,
                        color,
                        this.blockSize
                    );
                }
            }
        }
    }

    // 다음 블록 그리기
    drawNextPiece() {
        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (!this.nextPiece) return;

        const shape = this.nextPiece.getShape();
        const color = this.nextPiece.getColor();

        // 중앙 정렬
        const offsetX = (this.nextCanvas.width - shape[0].length * this.previewBlockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * this.previewBlockSize) / 2;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = offsetX + col * this.previewBlockSize;
                    const y = offsetY + row * this.previewBlockSize;
                    this.drawPreviewBlock(this.nextCtx, x, y, color, this.previewBlockSize);
                }
            }
        }
    }

    // 홀드 블록 그리기
    drawHoldPiece() {
        this.holdCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);

        if (!this.holdPiece) return;

        const shape = Piece.SHAPES[this.holdPiece.type][0];
        const color = Piece.COLORS[this.holdPiece.type];

        // 중앙 정렬
        const offsetX = (this.holdCanvas.width - shape[0].length * this.previewBlockSize) / 2;
        const offsetY = (this.holdCanvas.height - shape.length * this.previewBlockSize) / 2;

        // 홀드 사용 불가 시 어둡게 표시
        const alpha = this.canHold ? '' : '60';

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = offsetX + col * this.previewBlockSize;
                    const y = offsetY + row * this.previewBlockSize;
                    this.drawPreviewBlock(this.holdCtx, x, y, color + alpha, this.previewBlockSize);
                }
            }
        }
    }

    // 블록 그리기 (3D 효과 포함)
    drawBlock(ctx, gridX, gridY, color, size) {
        const x = gridX * size;
        const y = gridY * size;
        const padding = 2;

        // 메인 색상
        ctx.fillStyle = color;
        ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);

        // 하이라이트 (상단, 좌측)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + padding, y + padding, size - padding * 2, 3);
        ctx.fillRect(x + padding, y + padding, 3, size - padding * 2);

        // 그림자 (하단, 우측)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + padding, y + size - padding - 3, size - padding * 2, 3);
        ctx.fillRect(x + size - padding - 3, y + padding, 3, size - padding * 2);
    }

    // 프리뷰 블록 그리기
    drawPreviewBlock(ctx, x, y, color, size) {
        const padding = 2;

        ctx.fillStyle = color;
        ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + padding, y + padding, size - padding * 2, 2);
        ctx.fillRect(x + padding, y + padding, 2, size - padding * 2);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + padding, y + size - padding - 2, size - padding * 2, 2);
        ctx.fillRect(x + size - padding - 2, y + padding, 2, size - padding * 2);
    }
}

// 게임 인스턴스 생성 및 시작
const game = new Game();
game.draw();
