const { generateBlogPost, savePost, getCurrentDate } = require('./auto_post');

const soccerKeywords = [
    '울산 HD FC 대 전북 현대 모터스 현대가 더비 전술 분석',
    'FC 서울 린가드 영입 이후의 전술적 영향과 변화 분석',
    '토트넘 홋스퍼 손흥민의 새로운 윙포워드 역할 분석',
    '바이에른 뮌헨 김민재의 센터백 전술적 위치와 수비 전술 분석',
    '파리 생제르맹 이강인의 하프스페이스 공략 전술 분석',
    '대한민국 축구 국가대표팀 새로운 빌드업 전술 분석',
    '대전 하나시티즌의 역습 전술과 홈 경기 운영 방식 분석',
    '포항 스틸러스 박태하 감독의 하이브리드 빌드업 전술 분석',
    '맨체스터 시티 펩 과르디올라의 인버티드 풀백 전술 트렌드',
    '아스널 FC 아르테타 감독의 하이 프레싱(전방 압박) 전술 구조',
    '레알 마드리드 킬리안 음바페 합류 이후의 공격 라인 전술 유기성',
    '바르셀로나 한지 플릭 감독의 게겐프레싱 적용과 전술 분석',
    '리버풀 FC 슬롯 감독 체제에서의 중원 빌드업과 템포 조절',
    '첼시 FC의 유기적인 스위칭 플레이와 젊은 공격진 전술 분석',
    '이탈리아 세리에A 유벤투스의 콤팩트한 수비 블록 구축 전술',
    'K리그1 강원 FC 윤정환 감독의 돌풍 비결과 하이브리드 3백 전술',
    '현대 축구에서의 5초 룰(5-Second Rule)과 즉각 압박 전술 트렌드',
    '하프스페이스(Half-space) 장악이 현대 전술에서 갖는 중요성 분석',
    '빌드업 축구에서 골키퍼의 스위퍼 키퍼 역할과 1차 빌드업 기여',
    '수원 삼성 블루윙즈의 K리그1 승격을 위한 4-4-2 포메이션 전술 과제'
];

async function seed() {
    console.log(`Starting to seed ${soccerKeywords.length} soccer posts using Mistral Large 3...`);
    
    for (let i = 0; i < soccerKeywords.length; i++) {
        const keyword = soccerKeywords[i];
        console.log(`\n[${i + 1}/${soccerKeywords.length}] Processing soccer keyword: ${keyword}`);
        
        const dateInfo = getCurrentDate();
        
        try {
            const postContent = await generateBlogPost(keyword);
            await savePost(keyword, postContent, dateInfo);
            console.log(`Successfully generated and saved post for: ${keyword}`);
        } catch (err) {
            console.error(`Error generating post for keyword "${keyword}":`, err.message);
        }
        
        if (i < soccerKeywords.length - 1) {
            console.log('Waiting 15 seconds to prevent Rate Limits and TimeoutErrors...');
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
    }
    
    console.log('\nSeeding completed successfully!');
}

seed();
