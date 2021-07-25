﻿CREATE TYPE [dbo].[RoleMembershipList] AS TABLE
(
	[Index]			INT				DEFAULT 0,
	[HeaderIndex]	INT				DEFAULT 0,
    PRIMARY KEY CLUSTERED ([Index], [HeaderIndex]),
	[Id]			INT,
	[UserId]		INT,
	[RoleId]		INT,
	[Memo]			NVARCHAR(255)
);