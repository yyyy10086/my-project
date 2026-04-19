package yin.xuebiblockchain.Schedule;

import jakarta.annotation.Resource;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import yin.xuebiblockchain.Service.TransactionService;

@Component
@EnableScheduling
public class BlockScheduler {

    @Resource
    private TransactionService transactionService;

    @Scheduled(fixedDelay = 10000) // 每10秒检查一次
    public void schedulePackBlock() {
        transactionService.packBlockIfNeeded();
    }
}