REQUIRED: Your webhook should reply 200 OK immediately after receiving webhook, so that WeKan continues working:

https://github.com/wekan/wekan/issues/5077#event-10054506387

https://github.com/wekan/webhook/blob/main/public/index.php#L48C1-L48C1

***

For receiving webhooks on local network, you could use:

1) Some web form with PHP/Python/other backend, Google search for example code
how to receive webhook.

2) [NodeRED](https://github.com/wekan/wekan/issues/2017)

3) [Huginn or Flogo etc](https://github.com/wekan/wekan/issues/1160)

4) [Java](https://github.com/wekan/wekan/issues/2961#issuecomment-601599745)

At Internet you could use for example Zapier.