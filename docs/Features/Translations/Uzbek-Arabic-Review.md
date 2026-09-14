# Afghan Uzbek Arabic-script review

Reviewed **2026-09-14**, local commit `b433730e3`. `twoFactorCode-cancel` changes from بیکر قیلیش to
بیکار قیلیش, restoring the missing alif in the cancellation expression
corresponding to the existing Uzbek Bekor qilish. The verb and action are
preserved; the restored value is not replaced with English or Latin script.

[Indexed Afghan government Uzbek article](https://arg.gov.af/uz/post_details/news/eyJpdiI6IkttRjVTUjlaNm1qTjBRY3ZwVkJNeFE9PSIsInZhbHVlIjoiRUtXZGdrMXNQanRSSHRxWjRBdVZOZz09IiwibWFjIjoiYzkwNDhhZWU1NGM3MjVjMDk0YTljNjU5ZDRjNTA3YTk3ZDU0MTU2OGE0NDMwOWQ3OWU2MTdiOTZmN2RhMmIwMiJ9)
contains بیکار قیلیش in its indexed Uzbek passage about cancellation of
licenses. The full web fetch timed out and direct curl returned HTTP 522.
[AOP Uzbek article](https://aop.gov.af/uz/news_details/923) independently has
indexed بیکار بولیشینی, but its full fetch also timed out. These are source
leads and spelling support, not independently inspected full publications.

LOW CONFIDENCE orthographic verification: complete native source validation
remains open because the full pages could not be read. Exact-value, missing-
alif negative and accidental-Latin replacement checks are added. The member
2FA cancel action retains its cancellation meaning. Browser verification
has not run. This is a repair of one restored original finding, not a claim
that all Arabic-script Uzbek translations have been audited successfully.
