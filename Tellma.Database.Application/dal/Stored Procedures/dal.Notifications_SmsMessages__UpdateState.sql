﻿CREATE PROCEDURE [dal].[Notifications_SmsMessages__UpdateState]
	@Id					INT,
	@NewState			SMALLINT,
	@Error				NVARCHAR (2048),
	@Timestamp			DATETIMEOFFSET (7)
AS
BEGIN
SET NOCOUNT ON;
	UPDATE dbo.[SmsMessages]
	SET [State] = @NewState, [StateSince] = @Timestamp, [ErrorMessage] = @Error
	WHERE [Id] = @Id AND @NewState <> [State] AND (@NewState < 0 OR [State] < @NewState)
END
