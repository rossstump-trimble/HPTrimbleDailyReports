export const WESTMINSTER_XER = `ERMHDR\t3.0\t2026-03-01

%T\tPROJECT
%F\tproj_id\tproj_short_name
%R\t1\tWestminster Office Campus

%T\tPROJWBS
%F\twbs_id\tproj_id\tobs_id\tseq_num\twbs_short_name\twbs_name\tparent_wbs_id
%R\t0\t1\t\t0\tROOT\tWestminster Office Campus\t
%R\t1\t1\t\t1\tf-site\tSite Work\t0
%R\t8\t1\t\t8\tf-found\tFoundations\t0
%R\t17\t1\t\t17\tf-struct\tStructural\t0
%R\t26\t1\t\t26\tf-ext\tExterior Envelope\t0
%R\t33\t1\t\t33\tf-mep\tMEP Rough-In\t0
%R\t39\t1\t\t39\tf-int\tInterior Finishes\t0
%R\t47\t1\t\t47\tf-trim\tMEP Trim & Commissioning\t0
%R\t54\t1\t\t54\tf-close\tCloseout\t0

%T\tTASK
%F\ttask_id\twbs_id\ttask_code\ttask_name\ttarget_start_date\ttarget_end_date\ttarget_drtn_hr_cnt\tphys_complete_pct\ttask_type
%R\t1\t1\tf-site\tSite Work\t\t\t8\t0\tTT_WBS
%R\t2\t1\ta-mob\tMobilization\t2026-01-05\t2026-01-10\t40\t100\tTT_Task
%R\t3\t1\ta-clear\tClearing & Grubbing\t2026-01-10\t2026-01-15\t40\t100\tTT_Task
%R\t4\t1\ta-rough\tRough Grading\t2026-01-15\t2026-01-22\t56\t80\tTT_Task
%R\t5\t1\ta-util\tUtility Trenching\t2026-01-22\t2026-02-01\t80\t60\tTT_Task
%R\t6\t1\ta-fine\tFine Grading\t2026-02-01\t2026-02-06\t40\t20\tTT_Task
%R\t7\t1\ta-pave\tPaving\t2026-02-06\t2026-02-17\t88\t0\tTT_Task
%R\t8\t8\tf-found\tFoundations\t\t\t8\t0\tTT_WBS
%R\t9\t8\ta-exc\tExcavation\t2026-02-01\t2026-02-09\t64\t40\tTT_Task
%R\t10\t8\ta-ftgf\tFootings Formwork\t2026-02-09\t2026-02-15\t48\t20\tTT_Task
%R\t11\t8\ta-ftgr\tFootings Rebar\t2026-02-15\t2026-02-20\t40\t10\tTT_Task
%R\t12\t8\ta-pftg\tPour Footings\t2026-02-20\t2026-02-23\t24\t0\tTT_Task
%R\t13\t8\ta-fwf\tFoundation Walls Formwork\t2026-02-23\t2026-03-02\t56\t0\tTT_Task
%R\t14\t8\ta-pfwl\tPour Foundation Walls\t2026-03-02\t2026-03-05\t24\t0\tTT_Task
%R\t15\t8\ta-wtrp\tWaterproofing\t2026-03-05\t2026-03-10\t40\t0\tTT_Task
%R\t16\t8\ta-bkfl\tBackfill\t2026-03-10\t2026-03-14\t32\t0\tTT_Task
%R\t17\t17\tf-struct\tStructural\t\t\t8\t0\tTT_WBS
%R\t18\t17\ta-col\tColumns\t2026-03-14\t2026-03-22\t64\t0\tTT_Task
%R\t19\t17\ta-beam\tBeams & Girders\t2026-03-22\t2026-03-29\t56\t0\tTT_Task
%R\t20\t17\ta-esf\tElevated Slab Formwork\t2026-03-29\t2026-04-04\t48\t0\tTT_Task
%R\t21\t17\ta-esr\tElevated Slab Rebar\t2026-04-04\t2026-04-09\t40\t0\tTT_Task
%R\t22\t17\ta-pes\tPour Elevated Slab\t2026-04-09\t2026-04-12\t24\t0\tTT_Task
%R\t23\t17\ta-shw\tShear Walls\t2026-04-12\t2026-04-22\t80\t0\tTT_Task
%R\t24\t17\ta-sse\tStructural Steel Erection\t2026-04-22\t2026-05-04\t96\t0\tTT_Task
%R\t25\t17\ta-mdk\tMetal Decking\t2026-05-04\t2026-05-09\t40\t0\tTT_Task
%R\t26\t26\tf-ext\tExterior Envelope\t\t\t8\t0\tTT_WBS
%R\t27\t26\ta-cwi\tCurtain Wall Install\t2026-05-09\t2026-05-24\t120\t0\tTT_Task
%R\t28\t26\ta-msn\tMasonry Veneer\t2026-05-24\t2026-06-05\t96\t0\tTT_Task
%R\t29\t26\ta-roof\tRoofing\t2026-06-05\t2026-06-13\t64\t0\tTT_Task
%R\t30\t26\ta-wab\tWaterproofing / Air Barrier\t2026-06-13\t2026-06-20\t56\t0\tTT_Task
%R\t31\t26\ta-wnd\tWindows & Doors\t2026-06-20\t2026-06-30\t80\t0\tTT_Task
%R\t32\t26\ta-clk\tCaulking / Sealants\t2026-06-30\t2026-07-05\t40\t0\tTT_Task
%R\t33\t33\tf-mep\tMEP Rough-In\t\t\t8\t0\tTT_WBS
%R\t34\t33\ta-mri\tMechanical Rough-In\t2026-06-13\t2026-06-25\t96\t0\tTT_Task
%R\t35\t33\ta-eri\tElectrical Rough-In\t2026-06-13\t2026-06-25\t96\t0\tTT_Task
%R\t36\t33\ta-pri\tPlumbing Rough-In\t2026-06-25\t2026-07-05\t80\t0\tTT_Task
%R\t37\t33\ta-fpri\tFire Protection Rough-In\t2026-07-05\t2026-07-13\t64\t0\tTT_Task
%R\t38\t33\ta-lvri\tLow Voltage Rough-In\t2026-07-05\t2026-07-12\t56\t0\tTT_Task
%R\t39\t39\tf-int\tInterior Finishes\t\t\t8\t0\tTT_WBS
%R\t40\t39\ta-dwf\tDrywall Framing\t2026-07-13\t2026-07-23\t80\t0\tTT_Task
%R\t41\t39\ta-dwhf\tDrywall Hang & Finish\t2026-07-23\t2026-08-04\t96\t0\tTT_Task
%R\t42\t39\ta-pnt\tPainting\t2026-08-04\t2026-08-14\t80\t0\tTT_Task
%R\t43\t39\ta-flr\tFlooring\t2026-08-14\t2026-08-22\t64\t0\tTT_Task
%R\t44\t39\ta-ceil\tCeiling Grid / Tile\t2026-08-22\t2026-08-28\t48\t0\tTT_Task
%R\t45\t39\ta-mill\tMillwork & Casework\t2026-08-28\t2026-09-04\t56\t0\tTT_Task
%R\t46\t39\ta-spec\tSpecialties\t2026-09-04\t2026-09-09\t40\t0\tTT_Task
%R\t47\t47\tf-trim\tMEP Trim & Commissioning\t\t\t8\t0\tTT_WBS
%R\t48\t47\ta-mtrim\tMechanical Trim\t2026-09-09\t2026-09-16\t56\t0\tTT_Task
%R\t49\t47\ta-etrim\tElectrical Trim & Panels\t2026-09-09\t2026-09-16\t56\t0\tTT_Task
%R\t50\t47\ta-pfix\tPlumbing Fixtures\t2026-09-16\t2026-09-21\t40\t0\tTT_Task
%R\t51\t47\ta-falm\tFire Alarm / Detection\t2026-09-16\t2026-09-21\t40\t0\tTT_Task
%R\t52\t47\ta-cbas\tControls & BAS\t2026-09-21\t2026-09-28\t56\t0\tTT_Task
%R\t53\t47\ta-comm\tCommissioning\t2026-09-28\t2026-10-08\t80\t0\tTT_Task
%R\t54\t54\tf-close\tCloseout\t\t\t8\t0\tTT_WBS
%R\t55\t54\ta-pnch\tPunch List\t2026-10-08\t2026-10-18\t80\t0\tTT_Task
%R\t56\t54\ta-finsp\tFinal Inspections\t2026-10-18\t2026-10-23\t40\t0\tTT_Task
%R\t57\t54\ta-asb\tAs-Built Drawings\t2026-10-18\t2026-10-25\t56\t0\tTT_Task
%R\t58\t54\ta-omm\tO&M Manuals\t2026-10-25\t2026-10-30\t40\t0\tTT_Task
%R\t59\t54\ta-subco\tSubstantial Completion\t2026-10-30\t2026-10-31\t8\t0\tTT_Task
%R\t60\t54\ta-finco\tFinal Completion\t2026-11-05\t2026-11-06\t8\t0\tTT_Task

%T\tTASKPRED
%F\ttask_pred_id\ttask_id\tpred_task_id\tpred_type\tlag_hr_cnt
%R\t1\t3\t2\tPR_FS\t0
%R\t2\t4\t3\tPR_FS\t0
%R\t3\t5\t4\tPR_FS\t0
%R\t4\t6\t5\tPR_FS\t0
%R\t5\t7\t6\tPR_FS\t0
%R\t6\t9\t5\tPR_FS\t0
%R\t7\t10\t9\tPR_FS\t0
%R\t8\t11\t10\tPR_FS\t0
%R\t9\t12\t11\tPR_FS\t0
%R\t10\t13\t12\tPR_FS\t0
%R\t11\t14\t13\tPR_FS\t0
%R\t12\t15\t14\tPR_FS\t0
%R\t13\t16\t15\tPR_FS\t0
%R\t14\t18\t16\tPR_FS\t0
%R\t15\t19\t18\tPR_FS\t0
%R\t16\t20\t19\tPR_FS\t0
%R\t17\t21\t20\tPR_FS\t0
%R\t18\t22\t21\tPR_FS\t0
%R\t19\t23\t22\tPR_FS\t0
%R\t20\t24\t23\tPR_FS\t0
%R\t21\t25\t24\tPR_FS\t0
%R\t22\t27\t25\tPR_FS\t0
%R\t23\t28\t27\tPR_FS\t0
%R\t24\t29\t28\tPR_FS\t0
%R\t25\t30\t29\tPR_FS\t0
%R\t26\t31\t30\tPR_FS\t0
%R\t27\t32\t31\tPR_FS\t0
%R\t28\t34\t29\tPR_FS\t0
%R\t29\t35\t29\tPR_FS\t0
%R\t30\t36\t34\tPR_FS\t0
%R\t31\t36\t35\tPR_FS\t0
%R\t32\t37\t36\tPR_FS\t0
%R\t33\t38\t36\tPR_FS\t0
%R\t34\t40\t37\tPR_FS\t0
%R\t35\t41\t40\tPR_FS\t0
%R\t36\t42\t41\tPR_FS\t0
%R\t37\t43\t42\tPR_FS\t0
%R\t38\t44\t43\tPR_FS\t0
%R\t39\t45\t44\tPR_FS\t0
%R\t40\t46\t45\tPR_FS\t0
%R\t41\t48\t46\tPR_FS\t0
%R\t42\t49\t46\tPR_FS\t0
%R\t43\t50\t48\tPR_FS\t0
%R\t44\t51\t49\tPR_FS\t0
%R\t45\t52\t50\tPR_FS\t0
%R\t46\t52\t51\tPR_FS\t0
%R\t47\t53\t52\tPR_FS\t0
%R\t48\t55\t53\tPR_FS\t0
%R\t49\t56\t55\tPR_FS\t0
%R\t50\t57\t55\tPR_FS\t0
%R\t51\t58\t56\tPR_FS\t0
%R\t52\t58\t57\tPR_FS\t0
%R\t53\t59\t58\tPR_FS\t0
%R\t54\t60\t59\tPR_FS\t40

%E`;
